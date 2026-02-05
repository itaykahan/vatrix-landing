import { createClient } from '@supabase/supabase-js';

// Environment variables - these should be set in .env.local
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

// Create a single supabase client for interacting with your database
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Edge Function URLs
export const CALCULATE_VAT_URL = 'https://vvnlcytnivniqzaviluz.supabase.co/functions/v1/calculate-vat';
export const REBBI_URL = 'https://vvnlcytnivniqzaviluz.supabase.co/functions/v1/rebbi';

// Types for the API responses
export interface CalculateVATResponse {
  success: boolean;
  data?: {
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
    raw_text?: string;
    confidence?: number;
    line_items?: Array<{
      description: string;
      quantity?: number;
      unit_price?: number;
      total?: number;
    }>;
  };
  error?: string;
}

export interface RebbiResponse {
  success: boolean;
  data?: {
    eligibility: 'approved' | 'not_eligible' | 'needs_review';
    refundable_amount?: number;
    reasoning: string;
    rule_hits?: Array<{
      code: string;
      title: string;
      passed: boolean;
      severity: 'blocker' | 'warning' | 'info';
      message: string;
    }>;
    confidence?: number;
  };
  error?: string;
}

// Helper to call Edge Functions with proper auth
export async function callEdgeFunction<T>(
  url: string,
  body: any,
  options?: {
    timeout?: number;
    contentType?: string;
  }
): Promise<T> {
  const timeout = options?.timeout || 60000; // 60s default
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const headers: Record<string, string> = {
      'Authorization': `Bearer ${supabaseAnonKey}`,
    };

    // Handle different content types
    let requestBody: any;
    if (options?.contentType === 'multipart/form-data') {
      // Don't set Content-Type for FormData - browser will set it with boundary
      requestBody = body;
    } else {
      headers['Content-Type'] = 'application/json';
      requestBody = JSON.stringify(body);
    }

    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: requestBody,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP ${response.status}: ${errorText}`);
    }

    return await response.json();
  } catch (error) {
    clearTimeout(timeoutId);
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error('Request timed out. Please try again.');
    }
    throw error;
  }
}

// Convert file to base64
export async function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const result = reader.result as string;
      // Remove the data URL prefix (e.g., "data:image/jpeg;base64,")
      const base64 = result.split(',')[1];
      resolve(base64);
    };
    reader.onerror = (error) => reject(error);
  });
}
