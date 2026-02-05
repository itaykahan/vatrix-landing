'use client';

import React from 'react';

interface SummaryBarProps {
  total_receipts: number;
  total_vat_found: number;
  total_refundable: number;
  approved_count: number;
  not_eligible_count: number;
  review_count: number;
  error_count: number;
  currency?: string;
  onExportJSON: () => void;
  onExportCSV: () => void;
}

function formatCurrency(amount: number, currency: string = 'EUR'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 2,
  }).format(amount);
}

export function SummaryBar({
  total_receipts,
  total_vat_found,
  total_refundable,
  approved_count,
  not_eligible_count,
  review_count,
  error_count,
  currency = 'EUR',
  onExportJSON,
  onExportCSV,
}: SummaryBarProps) {
  const processed = approved_count + not_eligible_count + review_count;

  return (
    <div className="summary-bar">
      <div className="summary-content">
        {/* Main Stats */}
        <div className="stats-section">
          <div className="stat-group primary">
            <div className="stat-item large">
              <span className="stat-value highlight">{formatCurrency(total_refundable, currency)}</span>
              <span className="stat-label">Total Refundable</span>
            </div>
            <div className="stat-item">
              <span className="stat-value">{formatCurrency(total_vat_found, currency)}</span>
              <span className="stat-label">VAT Found</span>
            </div>
          </div>

          <div className="stat-divider" />

          <div className="stat-group">
            <div className="stat-item">
              <span className="stat-value">{total_receipts}</span>
              <span className="stat-label">Total Receipts</span>
            </div>
            <div className="stat-item">
              <span className="stat-value">{processed}</span>
              <span className="stat-label">Processed</span>
            </div>
          </div>

          <div className="stat-divider" />

          <div className="stat-group status-group">
            <div className="status-item approved">
              <span className="status-count">{approved_count}</span>
              <span className="status-label">Approved</span>
            </div>
            <div className="status-item not-eligible">
              <span className="status-count">{not_eligible_count}</span>
              <span className="status-label">Not Eligible</span>
            </div>
            <div className="status-item review">
              <span className="status-count">{review_count}</span>
              <span className="status-label">Review</span>
            </div>
            {error_count > 0 && (
              <div className="status-item error">
                <span className="status-count">{error_count}</span>
                <span className="status-label">Errors</span>
              </div>
            )}
          </div>
        </div>

        {/* Export Buttons */}
        <div className="export-section">
          <button className="export-btn" onClick={onExportJSON} disabled={processed === 0}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M21 15V19C21 19.5304 20.7893 20.0391 20.4142 20.4142C20.0391 20.7893 19.5304 21 19 21H5C4.46957 21 3.96086 20.7893 3.58579 20.4142C3.21071 20.0391 3 19.5304 3 19V15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M7 10L12 15L17 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M12 15V3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            JSON
          </button>
          <button className="export-btn" onClick={onExportCSV} disabled={processed === 0}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M21 15V19C21 19.5304 20.7893 20.0391 20.4142 20.4142C20.0391 20.7893 19.5304 21 19 21H5C4.46957 21 3.96086 20.7893 3.58579 20.4142C3.21071 20.0391 3 19.5304 3 19V15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M7 10L12 15L17 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M12 15V3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            CSV
          </button>
        </div>
      </div>

      <style jsx>{`
        .summary-bar {
          background: linear-gradient(180deg, rgba(0, 212, 255, 0.05) 0%, rgba(123, 97, 255, 0.03) 100%);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 16px;
          padding: 20px 24px;
        }

        .summary-content {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 24px;
        }

        .stats-section {
          display: flex;
          align-items: center;
          gap: 24px;
          flex-wrap: wrap;
        }

        .stat-group {
          display: flex;
          align-items: center;
          gap: 24px;
        }

        .stat-group.primary {
          gap: 32px;
        }

        .stat-divider {
          width: 1px;
          height: 40px;
          background: rgba(255, 255, 255, 0.1);
        }

        .stat-item {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .stat-item.large .stat-value {
          font-size: 28px;
        }

        .stat-value {
          font-size: 20px;
          font-weight: 700;
          color: #ffffff;
          font-family: 'JetBrains Mono', monospace;
        }

        .stat-value.highlight {
          background: linear-gradient(90deg, #00ff88, #00d4ff);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .stat-label {
          font-size: 11px;
          color: rgba(255, 255, 255, 0.5);
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .status-group {
          display: flex;
          gap: 16px;
        }

        .status-item {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 6px 12px;
          border-radius: 20px;
          background: rgba(255, 255, 255, 0.05);
        }

        .status-item.approved {
          background: rgba(0, 255, 136, 0.1);
        }

        .status-item.approved .status-count {
          color: #00ff88;
        }

        .status-item.not-eligible {
          background: rgba(255, 107, 157, 0.1);
        }

        .status-item.not-eligible .status-count {
          color: #ff6b9d;
        }

        .status-item.review {
          background: rgba(255, 179, 71, 0.1);
        }

        .status-item.review .status-count {
          color: #ffb347;
        }

        .status-item.error {
          background: rgba(255, 107, 157, 0.1);
        }

        .status-item.error .status-count {
          color: #ff6b9d;
        }

        .status-count {
          font-size: 16px;
          font-weight: 700;
          font-family: 'JetBrains Mono', monospace;
        }

        .status-label {
          font-size: 12px;
          color: rgba(255, 255, 255, 0.6);
        }

        .export-section {
          display: flex;
          gap: 8px;
        }

        .export-btn {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 10px 16px;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 8px;
          color: rgba(255, 255, 255, 0.8);
          font-size: 13px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .export-btn:hover:not(:disabled) {
          background: rgba(255, 255, 255, 0.1);
          border-color: rgba(255, 255, 255, 0.2);
          color: #ffffff;
        }

        .export-btn:disabled {
          opacity: 0.4;
          cursor: not-allowed;
        }

        @media (max-width: 1024px) {
          .summary-content {
            flex-direction: column;
            align-items: stretch;
          }

          .stats-section {
            justify-content: center;
          }

          .export-section {
            justify-content: center;
            border-top: 1px solid rgba(255, 255, 255, 0.1);
            padding-top: 16px;
          }
        }

        @media (max-width: 640px) {
          .summary-bar {
            padding: 16px;
          }

          .stat-group {
            flex-wrap: wrap;
            gap: 16px;
          }

          .stat-group.primary {
            gap: 16px;
          }

          .stat-divider {
            display: none;
          }

          .stat-item.large .stat-value {
            font-size: 24px;
          }

          .status-group {
            flex-wrap: wrap;
            justify-content: center;
          }
        }
      `}</style>
    </div>
  );
}
