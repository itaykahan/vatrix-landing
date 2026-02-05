import {
  CALCULATE_VAT_URL,
  REBBI_URL,
  callEdgeFunction,
  fileToBase64,
  CalculateVATResponse,
  RebbiResponse,
} from './supabase';

// Status types for the processing queue
export type ProcessingStatus =
  | 'queued'
  | 'uploading'
  | 'processing_ocr'
  | 'running_rules'
  | 'done'
  | 'error';

export type EligibilityStatus = 'approved' | 'not_eligible' | 'needs_review';

export interface QueuedFile {
  id: string;
  file: File;
  status: ProcessingStatus;
  progress: number;
  error?: string;
  result?: ProcessedResult;
}

export interface ProcessedResult {
  // From OCR (System 1)
  vendor_name?: string;
  vendor_vat?: string;
  vendor_address?: string;
  invoice_number?: string;
  invoice_date?: string;
  total_amount?: number;
  net_amount?: number;
  vat_amount?: number;
  vat_rate?: number;
  currency?: string;
  country?: string;
  category?: string;
  ocr_confidence?: number;
  
  // From Rules Engine (System 2)
  eligibility: EligibilityStatus;
  refundable_amount?: number;
  reasoning: string;
  rule_hits?: Array<{
    code: string;
    title: string;
    passed: boolean;
    severity: 'blocker' | 'warning' | 'info';
    message: string;
  }>;
  rules_confidence?: number;
}

export interface CompanyDetails {
  company_name: string;
  company_country: string;
  vat_id?: string;
  email?: string;
}

// Max file size: 15MB
export const MAX_FILE_SIZE = 15 * 1024 * 1024;

// Allowed file types
export const ALLOWED_TYPES = [
  'application/pdf',
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/heic',
  'image/heif',
];

export const ALLOWED_EXTENSIONS = ['pdf', 'jpg', 'jpeg', 'png', 'heic', 'heif'];

// Validate a file before processing
export function validateFile(file: File): { valid: boolean; error?: string } {
  // Check file size
  if (file.size > MAX_FILE_SIZE) {
    return {
      valid: false,
      error: `File too large. Maximum size is ${MAX_FILE_SIZE / 1024 / 1024}MB.`,
    };
  }

  // Check file type
  const extension = file.name.split('.').pop()?.toLowerCase() || '';
  if (!ALLOWED_EXTENSIONS.includes(extension)) {
    return {
      valid: false,
      error: `Invalid file type. Allowed: ${ALLOWED_EXTENSIONS.join(', ')}`,
    };
  }

  return { valid: true };
}

// Generate a unique ID for queue items
export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

// Process a single file through the complete pipeline
export async function processFile(
  file: File,
  companyDetails: CompanyDetails,
  onStatusUpdate: (status: ProcessingStatus, progress: number) => void
): Promise<ProcessedResult> {
  try {
    // Step 1: Convert to base64
    onStatusUpdate('uploading', 10);
    const base64Data = await fileToBase64(file);
    onStatusUpdate('uploading', 30);

    // Step 2: Call OCR (System 1)
    onStatusUpdate('processing_ocr', 40);
    
    // Prepare the payload for calculate-vat
    // Try base64 first, fall back to form data if needed
    const ocrPayload = {
      file: {
        name: file.name,
        type: file.type,
        data: base64Data,
      },
      company: {
        name: companyDetails.company_name,
        country: companyDetails.company_country,
        vat_id: companyDetails.vat_id,
      },
    };

    let ocrResponse: CalculateVATResponse;
    try {
      ocrResponse = await callEdgeFunction<CalculateVATResponse>(
        CALCULATE_VAT_URL,
        ocrPayload,
        { timeout: 90000 } // 90s timeout for OCR
      );
    } catch (error) {
      // If JSON fails, try multipart/form-data
      console.log('Trying multipart/form-data for OCR...');
      const formData = new FormData();
      formData.append('file', file);
      formData.append('company_name', companyDetails.company_name);
      formData.append('company_country', companyDetails.company_country);
      if (companyDetails.vat_id) {
        formData.append('vat_id', companyDetails.vat_id);
      }

      ocrResponse = await callEdgeFunction<CalculateVATResponse>(
        CALCULATE_VAT_URL,
        formData,
        { timeout: 90000, contentType: 'multipart/form-data' }
      );
    }

    onStatusUpdate('processing_ocr', 60);

    if (!ocrResponse.success || !ocrResponse.data) {
      throw new Error(ocrResponse.error || 'OCR processing failed');
    }

    // Step 3: Call Rules Engine (System 2)
    onStatusUpdate('running_rules', 70);

    const rebbiPayload = {
      extraction: ocrResponse.data,
      company: {
        name: companyDetails.company_name,
        country: companyDetails.company_country,
        vat_id: companyDetails.vat_id,
      },
    };

    const rebbiResponse = await callEdgeFunction<RebbiResponse>(
      REBBI_URL,
      rebbiPayload,
      { timeout: 30000 } // 30s timeout for rules
    );

    onStatusUpdate('running_rules', 90);

    if (!rebbiResponse.success || !rebbiResponse.data) {
      // If rules engine fails, still return OCR data with "needs_review"
      console.warn('Rules engine failed, returning OCR data only');
      return {
        ...ocrResponse.data,
        ocr_confidence: ocrResponse.data.confidence,
        eligibility: 'needs_review',
        reasoning: rebbiResponse.error || 'Rules engine unavailable. Manual review required.',
      };
    }

    // Combine results
    onStatusUpdate('done', 100);
    
    return {
      ...ocrResponse.data,
      ocr_confidence: ocrResponse.data.confidence,
      eligibility: rebbiResponse.data.eligibility,
      refundable_amount: rebbiResponse.data.refundable_amount,
      reasoning: rebbiResponse.data.reasoning,
      rule_hits: rebbiResponse.data.rule_hits,
      rules_confidence: rebbiResponse.data.confidence,
    };

  } catch (error) {
    throw error;
  }
}

// Process multiple files sequentially (safer) or concurrently
export async function processFiles(
  files: QueuedFile[],
  companyDetails: CompanyDetails,
  onFileUpdate: (id: string, status: ProcessingStatus, progress: number, result?: ProcessedResult, error?: string) => void,
  options?: {
    concurrent?: boolean;
    maxConcurrent?: number;
  }
): Promise<void> {
  const concurrent = options?.concurrent ?? false;
  const maxConcurrent = options?.maxConcurrent ?? 3;

  if (concurrent) {
    // Process in batches for controlled concurrency
    const batches: QueuedFile[][] = [];
    for (let i = 0; i < files.length; i += maxConcurrent) {
      batches.push(files.slice(i, i + maxConcurrent));
    }

    for (const batch of batches) {
      await Promise.all(
        batch.map(async (queuedFile) => {
          try {
            const result = await processFile(
              queuedFile.file,
              companyDetails,
              (status, progress) => onFileUpdate(queuedFile.id, status, progress)
            );
            onFileUpdate(queuedFile.id, 'done', 100, result);
          } catch (error) {
            onFileUpdate(
              queuedFile.id,
              'error',
              0,
              undefined,
              error instanceof Error ? error.message : 'Processing failed'
            );
          }
        })
      );
    }
  } else {
    // Process sequentially (default)
    for (const queuedFile of files) {
      try {
        const result = await processFile(
          queuedFile.file,
          companyDetails,
          (status, progress) => onFileUpdate(queuedFile.id, status, progress)
        );
        onFileUpdate(queuedFile.id, 'done', 100, result);
      } catch (error) {
        onFileUpdate(
          queuedFile.id,
          'error',
          0,
          undefined,
          error instanceof Error ? error.message : 'Processing failed'
        );
      }
    }
  }
}

// Calculate summary statistics from processed results
export function calculateSummary(files: QueuedFile[]): {
  total_receipts: number;
  total_vat_found: number;
  total_refundable: number;
  approved_count: number;
  not_eligible_count: number;
  review_count: number;
  error_count: number;
} {
  const processed = files.filter((f) => f.status === 'done' && f.result);
  const errors = files.filter((f) => f.status === 'error');

  return {
    total_receipts: files.length,
    total_vat_found: processed.reduce(
      (sum, f) => sum + (f.result?.vat_amount || 0),
      0
    ),
    total_refundable: processed.reduce(
      (sum, f) => sum + (f.result?.refundable_amount || 0),
      0
    ),
    approved_count: processed.filter(
      (f) => f.result?.eligibility === 'approved'
    ).length,
    not_eligible_count: processed.filter(
      (f) => f.result?.eligibility === 'not_eligible'
    ).length,
    review_count: processed.filter(
      (f) => f.result?.eligibility === 'needs_review'
    ).length,
    error_count: errors.length,
  };
}

// Export results as JSON
export function exportAsJSON(files: QueuedFile[], companyDetails: CompanyDetails): string {
  const data = {
    export_date: new Date().toISOString(),
    company: companyDetails,
    summary: calculateSummary(files),
    receipts: files
      .filter((f) => f.result)
      .map((f) => ({
        filename: f.file.name,
        ...f.result,
      })),
  };
  return JSON.stringify(data, null, 2);
}

// Export results as CSV
export function exportAsCSV(files: QueuedFile[]): string {
  const headers = [
    'Filename',
    'Vendor Name',
    'Country',
    'Invoice Date',
    'Invoice Number',
    'Net Amount',
    'VAT Amount',
    'Total Amount',
    'Currency',
    'Eligibility',
    'Refundable Amount',
    'Reasoning',
    'OCR Confidence',
  ];

  const rows = files
    .filter((f) => f.result)
    .map((f) => {
      const r = f.result!;
      return [
        f.file.name,
        r.vendor_name || '',
        r.country || '',
        r.invoice_date || '',
        r.invoice_number || '',
        r.net_amount?.toString() || '',
        r.vat_amount?.toString() || '',
        r.total_amount?.toString() || '',
        r.currency || '',
        r.eligibility,
        r.refundable_amount?.toString() || '',
        r.reasoning.replace(/,/g, ';').replace(/\n/g, ' '),
        r.ocr_confidence?.toString() || '',
      ];
    });

  const csvContent = [headers.join(','), ...rows.map((row) => row.join(','))].join('\n');
  return csvContent;
}

// Download helper
export function downloadFile(content: string, filename: string, mimeType: string): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
