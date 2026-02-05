'use client';

import React, { useState, useCallback } from 'react';
import Link from 'next/link';
import { UploadDropzone } from '@/components/UploadDropzone';
import { ReceiptQueueItem } from '@/components/ReceiptQueueItem';
import { ResultCard } from '@/components/ResultCard';
import { SummaryBar } from '@/components/SummaryBar';
import {
  QueuedFile,
  CompanyDetails,
  ProcessingStatus,
  ProcessedResult,
  generateId,
  processFiles,
  calculateSummary,
  exportAsJSON,
  exportAsCSV,
  downloadFile,
} from '@/lib/vat-service';

// EU Countries list
const EU_COUNTRIES = [
  { code: 'AT', name: 'Austria' },
  { code: 'BE', name: 'Belgium' },
  { code: 'BG', name: 'Bulgaria' },
  { code: 'HR', name: 'Croatia' },
  { code: 'CY', name: 'Cyprus' },
  { code: 'CZ', name: 'Czech Republic' },
  { code: 'DK', name: 'Denmark' },
  { code: 'EE', name: 'Estonia' },
  { code: 'FI', name: 'Finland' },
  { code: 'FR', name: 'France' },
  { code: 'DE', name: 'Germany' },
  { code: 'GR', name: 'Greece' },
  { code: 'HU', name: 'Hungary' },
  { code: 'IE', name: 'Ireland' },
  { code: 'IT', name: 'Italy' },
  { code: 'LV', name: 'Latvia' },
  { code: 'LT', name: 'Lithuania' },
  { code: 'LU', name: 'Luxembourg' },
  { code: 'MT', name: 'Malta' },
  { code: 'NL', name: 'Netherlands' },
  { code: 'PL', name: 'Poland' },
  { code: 'PT', name: 'Portugal' },
  { code: 'RO', name: 'Romania' },
  { code: 'SK', name: 'Slovakia' },
  { code: 'SI', name: 'Slovenia' },
  { code: 'ES', name: 'Spain' },
  { code: 'SE', name: 'Sweden' },
];

// Other countries (for the company's country of establishment)
const OTHER_COUNTRIES = [
  { code: 'IL', name: 'Israel' },
  { code: 'GB', name: 'United Kingdom' },
  { code: 'US', name: 'United States' },
  { code: 'CH', name: 'Switzerland' },
  { code: 'NO', name: 'Norway' },
];

const ALL_COUNTRIES = [...OTHER_COUNTRIES, ...EU_COUNTRIES].sort((a, b) => a.name.localeCompare(b.name));

export default function ScanPage() {
  // Company details
  const [companyDetails, setCompanyDetails] = useState<CompanyDetails>({
    company_name: '',
    company_country: 'IL', // Default to Israel
    vat_id: '',
    email: '',
  });

  // File queue
  const [queue, setQueue] = useState<QueuedFile[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);

  // Add files to queue
  const handleFilesAdded = useCallback((files: File[]) => {
    const newItems: QueuedFile[] = files.map((file) => ({
      id: generateId(),
      file,
      status: 'queued' as ProcessingStatus,
      progress: 0,
    }));
    setQueue((prev) => [...prev, ...newItems]);
  }, []);

  // Remove file from queue
  const handleRemoveFile = useCallback((id: string) => {
    setQueue((prev) => prev.filter((item) => item.id !== id));
  }, []);

  // Update file status
  const handleFileUpdate = useCallback(
    (id: string, status: ProcessingStatus, progress: number, result?: ProcessedResult, error?: string) => {
      setQueue((prev) =>
        prev.map((item) =>
          item.id === id
            ? { ...item, status, progress, result, error }
            : item
        )
      );
    },
    []
  );

  // Start processing
  const handleAnalyze = async () => {
    if (queue.length === 0 || !companyDetails.company_name) return;

    setIsProcessing(true);
    const queuedItems = queue.filter((item) => item.status === 'queued' || item.status === 'error');

    await processFiles(queuedItems, companyDetails, handleFileUpdate);

    setIsProcessing(false);
  };

  // Export functions
  const handleExportJSON = () => {
    const json = exportAsJSON(queue, companyDetails);
    const timestamp = new Date().toISOString().slice(0, 10);
    downloadFile(json, `vatrix-export-${timestamp}.json`, 'application/json');
  };

  const handleExportCSV = () => {
    const csv = exportAsCSV(queue);
    const timestamp = new Date().toISOString().slice(0, 10);
    downloadFile(csv, `vatrix-export-${timestamp}.csv`, 'text/csv');
  };

  // Clear all files
  const handleClearAll = () => {
    if (!isProcessing) {
      setQueue([]);
    }
  };

  // Calculate summary
  const summary = calculateSummary(queue);

  // Separate queue and results
  const queuedItems = queue.filter((item) => item.status !== 'done' || !item.result);
  const completedItems = queue.filter((item) => item.status === 'done' && item.result);

  // Check if can start processing
  const canProcess = queue.some((item) => item.status === 'queued' || item.status === 'error') && 
                     companyDetails.company_name.trim() !== '' &&
                     !isProcessing;

  return (
    <div className="scan-page">
      {/* Background Effects */}
      <div className="bg-system">
        <div className="aurora" />
        <div className="orb orb-1" />
        <div className="orb orb-2" />
        <div className="grid-bg" />
      </div>

      {/* Header */}
      <header className="header">
        <Link href="/" className="logo">
          <span className="logo-mark">V</span>
          <span className="logo-text">VAT<span className="logo-accent">rix</span></span>
        </Link>
        <nav className="nav">
          <Link href="/#features" className="nav-link">Features</Link>
          <Link href="/#process" className="nav-link">How it Works</Link>
          <Link href="/scan" className="nav-link active">Scan</Link>
        </nav>
      </header>

      {/* Main Content */}
      <main className="main">
        <div className="container">
          {/* Page Title */}
          <div className="page-header">
            <h1 className="page-title">Upload & Scan Receipts</h1>
            <p className="page-subtitle">
              Upload your receipts to check VAT recovery eligibility instantly
            </p>
          </div>

          {/* Company Details Form */}
          <section className="section company-section">
            <h2 className="section-title">Company Details</h2>
            <div className="company-form">
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="company_name">Company Name *</label>
                  <input
                    type="text"
                    id="company_name"
                    value={companyDetails.company_name}
                    onChange={(e) => setCompanyDetails({ ...companyDetails, company_name: e.target.value })}
                    placeholder="Enter company name"
                    disabled={isProcessing}
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="company_country">Country of Establishment *</label>
                  <select
                    id="company_country"
                    value={companyDetails.company_country}
                    onChange={(e) => setCompanyDetails({ ...companyDetails, company_country: e.target.value })}
                    disabled={isProcessing}
                  >
                    {ALL_COUNTRIES.map((country) => (
                      <option key={country.code} value={country.code}>
                        {country.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="vat_id">VAT ID (optional)</label>
                  <input
                    type="text"
                    id="vat_id"
                    value={companyDetails.vat_id}
                    onChange={(e) => setCompanyDetails({ ...companyDetails, vat_id: e.target.value })}
                    placeholder="e.g., IL123456789"
                    disabled={isProcessing}
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="email">Email (optional)</label>
                  <input
                    type="email"
                    id="email"
                    value={companyDetails.email}
                    onChange={(e) => setCompanyDetails({ ...companyDetails, email: e.target.value })}
                    placeholder="contact@company.com"
                    disabled={isProcessing}
                  />
                </div>
              </div>
            </div>
          </section>

          {/* Upload Section */}
          <section className="section upload-section">
            <h2 className="section-title">Upload Receipts</h2>
            <UploadDropzone onFilesAdded={handleFilesAdded} disabled={isProcessing} />
          </section>

          {/* Queue Section */}
          {queue.length > 0 && (
            <section className="section queue-section">
              <div className="section-header-row">
                <h2 className="section-title">
                  Queue ({queue.length} file{queue.length !== 1 ? 's' : ''})
                </h2>
                <div className="section-actions">
                  {!isProcessing && queue.length > 0 && (
                    <button className="btn-text" onClick={handleClearAll}>
                      Clear All
                    </button>
                  )}
                </div>
              </div>

              <div className="queue-list">
                {queue.map((item) => (
                  <ReceiptQueueItem
                    key={item.id}
                    item={item}
                    onRemove={handleRemoveFile}
                    disabled={isProcessing}
                  />
                ))}
              </div>

              {/* Analyze Button */}
              <div className="analyze-action">
                <button
                  className="btn-primary btn-large"
                  onClick={handleAnalyze}
                  disabled={!canProcess}
                >
                  {isProcessing ? (
                    <>
                      <span className="btn-spinner" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M21.21 15.89A10 10 0 1 1 8 2.83" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        <path d="M22 12A10 10 0 0 0 12 2V12H22Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                      Analyze Receipts
                    </>
                  )}
                </button>
                {!companyDetails.company_name && (
                  <p className="analyze-hint">Please enter your company name to continue</p>
                )}
              </div>
            </section>
          )}

          {/* Results Section */}
          {completedItems.length > 0 && (
            <section className="section results-section">
              <h2 className="section-title">Results</h2>

              {/* Summary Bar */}
              <SummaryBar
                {...summary}
                onExportJSON={handleExportJSON}
                onExportCSV={handleExportCSV}
              />

              {/* Result Cards */}
              <div className="results-grid">
                {completedItems.map((item) => (
                  <ResultCard
                    key={item.id}
                    filename={item.file.name}
                    result={item.result!}
                  />
                ))}
              </div>
            </section>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="footer">
        <div className="footer-content">
          <div className="footer-logo">
            <span className="logo-mark small">V</span>
            <span className="logo-text small">VATrix</span>
          </div>
          <p className="footer-text">© 2024 VATrix. All rights reserved.</p>
        </div>
      </footer>

      <style jsx>{`
        .scan-page {
          min-height: 100vh;
          display: flex;
          flex-direction: column;
          position: relative;
        }

        /* Background System */
        .bg-system {
          position: fixed;
          inset: 0;
          z-index: 0;
          overflow: hidden;
          pointer-events: none;
        }

        .aurora {
          position: absolute;
          width: 200%;
          height: 200%;
          top: -50%;
          left: -50%;
          background: 
            radial-gradient(ellipse 80% 50% at 20% 40%, rgba(0, 212, 255, 0.12), transparent 50%),
            radial-gradient(ellipse 60% 40% at 70% 20%, rgba(123, 97, 255, 0.1), transparent 50%),
            radial-gradient(ellipse 50% 50% at 80% 80%, rgba(255, 107, 157, 0.06), transparent 50%);
          filter: blur(60px);
          animation: aurora 25s ease-in-out infinite;
        }

        @keyframes aurora {
          0%, 100% { transform: translate(0, 0); }
          25% { transform: translate(3%, 3%); }
          50% { transform: translate(-2%, 5%); }
          75% { transform: translate(2%, -2%); }
        }

        .orb {
          position: absolute;
          border-radius: 50%;
          filter: blur(80px);
          animation: orbFloat 20s ease-in-out infinite;
        }

        .orb-1 {
          width: 500px;
          height: 500px;
          background: radial-gradient(circle, rgba(0, 212, 255, 0.25), transparent 70%);
          top: -10%;
          right: -10%;
        }

        .orb-2 {
          width: 400px;
          height: 400px;
          background: radial-gradient(circle, rgba(123, 97, 255, 0.25), transparent 70%);
          bottom: 10%;
          left: -10%;
          animation-delay: -7s;
        }

        @keyframes orbFloat {
          0%, 100% { transform: translate(0, 0); opacity: 0.6; }
          33% { transform: translate(20px, -30px); opacity: 0.8; }
          66% { transform: translate(-15px, 20px); opacity: 0.5; }
        }

        .grid-bg {
          position: absolute;
          inset: 0;
          background-image: 
            linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px);
          background-size: 80px 80px;
          mask-image: radial-gradient(ellipse 80% 60% at 50% 30%, black, transparent);
        }

        /* Header */
        .header {
          position: relative;
          z-index: 10;
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 20px 48px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.06);
        }

        .logo {
          display: flex;
          align-items: center;
          gap: 12px;
          text-decoration: none;
        }

        .logo-mark {
          width: 40px;
          height: 40px;
          background: linear-gradient(135deg, #00d4ff, #7b61ff);
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 800;
          font-size: 18px;
          color: #000;
        }

        .logo-mark.small {
          width: 28px;
          height: 28px;
          font-size: 14px;
          border-radius: 6px;
        }

        .logo-text {
          font-size: 22px;
          font-weight: 700;
          color: #ffffff;
        }

        .logo-text.small {
          font-size: 16px;
        }

        .logo-accent {
          color: #00d4ff;
        }

        .nav {
          display: flex;
          gap: 32px;
        }

        .nav-link {
          font-size: 14px;
          color: rgba(255, 255, 255, 0.6);
          text-decoration: none;
          transition: color 0.2s ease;
        }

        .nav-link:hover,
        .nav-link.active {
          color: #ffffff;
        }

        /* Main */
        .main {
          flex: 1;
          position: relative;
          z-index: 1;
          padding: 48px 0;
        }

        .container {
          max-width: 1000px;
          margin: 0 auto;
          padding: 0 24px;
        }

        /* Page Header */
        .page-header {
          text-align: center;
          margin-bottom: 48px;
        }

        .page-title {
          font-size: 40px;
          font-weight: 800;
          color: #ffffff;
          margin: 0 0 12px 0;
          background: linear-gradient(135deg, #ffffff 0%, rgba(255, 255, 255, 0.8) 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .page-subtitle {
          font-size: 18px;
          color: rgba(255, 255, 255, 0.6);
          margin: 0;
        }

        /* Sections */
        .section {
          margin-bottom: 40px;
        }

        .section-title {
          font-size: 16px;
          font-weight: 600;
          color: rgba(255, 255, 255, 0.8);
          margin: 0 0 16px 0;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .section-header-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 16px;
        }

        .section-header-row .section-title {
          margin-bottom: 0;
        }

        /* Company Form */
        .company-section {
          background: rgba(255, 255, 255, 0.02);
          border: 1px solid rgba(255, 255, 255, 0.06);
          border-radius: 16px;
          padding: 24px;
        }

        .company-form {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .form-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
        }

        .form-group {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .form-group label {
          font-size: 13px;
          color: rgba(255, 255, 255, 0.6);
        }

        .form-group input,
        .form-group select {
          padding: 12px 16px;
          background: rgba(0, 0, 0, 0.3);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 8px;
          color: #ffffff;
          font-size: 14px;
          transition: all 0.2s ease;
        }

        .form-group input::placeholder {
          color: rgba(255, 255, 255, 0.3);
        }

        .form-group input:focus,
        .form-group select:focus {
          outline: none;
          border-color: rgba(0, 212, 255, 0.5);
          background: rgba(0, 0, 0, 0.4);
        }

        .form-group select {
          cursor: pointer;
        }

        .form-group select option {
          background: #0a0a0a;
          color: #ffffff;
        }

        .form-group input:disabled,
        .form-group select:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        /* Queue */
        .queue-list {
          display: flex;
          flex-direction: column;
          gap: 8px;
          margin-bottom: 24px;
        }

        .analyze-action {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 12px;
        }

        .analyze-hint {
          font-size: 13px;
          color: rgba(255, 255, 255, 0.4);
          margin: 0;
        }

        /* Buttons */
        .btn-primary {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          padding: 14px 28px;
          background: linear-gradient(135deg, #00d4ff, #7b61ff);
          border: none;
          border-radius: 12px;
          color: #000;
          font-size: 15px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .btn-primary:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 10px 30px rgba(0, 212, 255, 0.3);
        }

        .btn-primary:disabled {
          opacity: 0.5;
          cursor: not-allowed;
          transform: none;
          box-shadow: none;
        }

        .btn-primary.btn-large {
          padding: 16px 40px;
          font-size: 16px;
        }

        .btn-spinner {
          width: 16px;
          height: 16px;
          border: 2px solid rgba(0, 0, 0, 0.3);
          border-top-color: #000;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        .btn-text {
          background: none;
          border: none;
          color: rgba(255, 255, 255, 0.6);
          font-size: 13px;
          cursor: pointer;
          padding: 8px 12px;
          transition: color 0.2s ease;
        }

        .btn-text:hover {
          color: #ff6b9d;
        }

        /* Results */
        .results-section .section-title {
          margin-bottom: 24px;
        }

        .results-grid {
          display: flex;
          flex-direction: column;
          gap: 16px;
          margin-top: 24px;
        }

        /* Footer */
        .footer {
          position: relative;
          z-index: 1;
          padding: 24px 48px;
          border-top: 1px solid rgba(255, 255, 255, 0.06);
        }

        .footer-content {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .footer-logo {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .footer-text {
          font-size: 12px;
          color: rgba(255, 255, 255, 0.4);
          margin: 0;
        }

        /* Responsive */
        @media (max-width: 768px) {
          .header {
            padding: 16px 20px;
            flex-wrap: wrap;
            gap: 16px;
          }

          .nav {
            gap: 20px;
          }

          .main {
            padding: 32px 0;
          }

          .page-title {
            font-size: 28px;
          }

          .page-subtitle {
            font-size: 16px;
          }

          .form-row {
            grid-template-columns: 1fr;
          }

          .footer {
            padding: 20px;
          }

          .footer-content {
            flex-direction: column;
            gap: 12px;
          }
        }
      `}</style>
    </div>
  );
}
