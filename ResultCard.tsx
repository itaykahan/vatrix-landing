'use client';

import React, { useState } from 'react';
import { ProcessedResult, EligibilityStatus } from '@/lib/vat-service';

interface ResultCardProps {
  filename: string;
  result: ProcessedResult;
}

const ELIGIBILITY_CONFIG: Record<EligibilityStatus, { label: string; color: string; bgColor: string; borderColor: string }> = {
  approved: {
    label: 'Approved',
    color: '#00ff88',
    bgColor: 'rgba(0, 255, 136, 0.1)',
    borderColor: 'rgba(0, 255, 136, 0.3)',
  },
  not_eligible: {
    label: 'Not Eligible',
    color: '#ff6b9d',
    bgColor: 'rgba(255, 107, 157, 0.1)',
    borderColor: 'rgba(255, 107, 157, 0.3)',
  },
  needs_review: {
    label: 'Needs Review',
    color: '#ffb347',
    bgColor: 'rgba(255, 179, 71, 0.1)',
    borderColor: 'rgba(255, 179, 71, 0.3)',
  },
};

function formatCurrency(amount: number | undefined, currency?: string): string {
  if (amount === undefined || amount === null) return '—';
  const currencyCode = currency || 'EUR';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currencyCode,
    minimumFractionDigits: 2,
  }).format(amount);
}

function formatDate(dateStr?: string): string {
  if (!dateStr) return '—';
  try {
    const date = new Date(dateStr);
    return new Intl.DateTimeFormat('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    }).format(date);
  } catch {
    return dateStr;
  }
}

function formatConfidence(confidence?: number): string {
  if (confidence === undefined || confidence === null) return '—';
  return `${Math.round(confidence * 100)}%`;
}

export function ResultCard({ filename, result }: ResultCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const config = ELIGIBILITY_CONFIG[result.eligibility];

  return (
    <div className="result-card" style={{ borderColor: config.borderColor }}>
      {/* Header */}
      <div className="card-header">
        <div className="header-left">
          <div className="vendor-info">
            <h3 className="vendor-name">{result.vendor_name || 'Unknown Vendor'}</h3>
            {result.country && (
              <span className="vendor-country">{result.country}</span>
            )}
          </div>
          <div className="file-name">{filename}</div>
        </div>
        <div 
          className="eligibility-badge"
          style={{ 
            color: config.color, 
            backgroundColor: config.bgColor,
            borderColor: config.borderColor,
          }}
        >
          {result.eligibility === 'approved' && (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M20 6L9 17L4 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          )}
          {result.eligibility === 'not_eligible' && (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
              <path d="M15 9L9 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M9 9L15 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          )}
          {result.eligibility === 'needs_review' && (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
              <path d="M12 8V12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              <circle cx="12" cy="16" r="1" fill="currentColor"/>
            </svg>
          )}
          {config.label}
        </div>
      </div>

      {/* Key Metrics */}
      <div className="metrics-grid">
        <div className="metric">
          <span className="metric-label">Invoice Date</span>
          <span className="metric-value">{formatDate(result.invoice_date)}</span>
        </div>
        <div className="metric">
          <span className="metric-label">Net Amount</span>
          <span className="metric-value">{formatCurrency(result.net_amount, result.currency)}</span>
        </div>
        <div className="metric">
          <span className="metric-label">VAT Amount</span>
          <span className="metric-value">{formatCurrency(result.vat_amount, result.currency)}</span>
        </div>
        <div className="metric">
          <span className="metric-label">Total</span>
          <span className="metric-value">{formatCurrency(result.total_amount, result.currency)}</span>
        </div>
      </div>

      {/* Refundable Amount */}
      {result.eligibility === 'approved' && result.refundable_amount !== undefined && (
        <div className="refundable-section">
          <div className="refundable-label">Refundable VAT</div>
          <div className="refundable-amount" style={{ color: config.color }}>
            {formatCurrency(result.refundable_amount, result.currency)}
          </div>
        </div>
      )}

      {/* Reasoning */}
      <div className="reasoning-section">
        <div className="reasoning-header">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
            <path d="M12 16V12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            <circle cx="12" cy="8" r="1" fill="currentColor"/>
          </svg>
          <span>Decision Reason</span>
        </div>
        <p className="reasoning-text">{result.reasoning}</p>
      </div>

      {/* Rule Hits (Expandable) */}
      {result.rule_hits && result.rule_hits.length > 0 && (
        <div className="rules-section">
          <button 
            className="rules-toggle"
            onClick={() => setIsExpanded(!isExpanded)}
          >
            <span>Rule Details ({result.rule_hits.length})</span>
            <svg 
              width="16" 
              height="16" 
              viewBox="0 0 24 24" 
              fill="none" 
              xmlns="http://www.w3.org/2000/svg"
              className={isExpanded ? 'rotated' : ''}
            >
              <path d="M6 9L12 15L18 9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
          
          {isExpanded && (
            <div className="rules-list">
              {result.rule_hits.map((hit, index) => (
                <div 
                  key={index} 
                  className={`rule-item ${hit.passed ? 'passed' : 'failed'} ${hit.severity}`}
                >
                  <div className="rule-header">
                    <span className="rule-code">{hit.code}</span>
                    <span className={`rule-status ${hit.passed ? 'passed' : 'failed'}`}>
                      {hit.passed ? 'Passed' : 'Failed'}
                    </span>
                  </div>
                  <div className="rule-title">{hit.title}</div>
                  <div className="rule-message">{hit.message}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Confidence Score */}
      {result.ocr_confidence !== undefined && (
        <div className="confidence-footer">
          <span className="confidence-label">OCR Confidence:</span>
          <span className="confidence-value">{formatConfidence(result.ocr_confidence)}</span>
        </div>
      )}

      <style jsx>{`
        .result-card {
          background: linear-gradient(180deg, rgba(255, 255, 255, 0.03) 0%, rgba(255, 255, 255, 0.01) 100%);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 16px;
          padding: 24px;
          transition: all 0.3s ease;
        }

        .result-card:hover {
          background: linear-gradient(180deg, rgba(255, 255, 255, 0.05) 0%, rgba(255, 255, 255, 0.02) 100%);
        }

        .card-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 16px;
          margin-bottom: 20px;
        }

        .header-left {
          flex: 1;
          min-width: 0;
        }

        .vendor-info {
          display: flex;
          align-items: center;
          gap: 8px;
          flex-wrap: wrap;
        }

        .vendor-name {
          font-size: 18px;
          font-weight: 600;
          color: #ffffff;
          margin: 0;
        }

        .vendor-country {
          font-size: 12px;
          color: rgba(255, 255, 255, 0.5);
          padding: 2px 8px;
          background: rgba(255, 255, 255, 0.05);
          border-radius: 4px;
        }

        .file-name {
          font-size: 12px;
          color: rgba(255, 255, 255, 0.4);
          margin-top: 4px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .eligibility-badge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 8px 16px;
          border-radius: 24px;
          font-size: 13px;
          font-weight: 600;
          border: 1px solid;
          white-space: nowrap;
        }

        .metrics-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 16px;
          padding: 16px 0;
          border-top: 1px solid rgba(255, 255, 255, 0.06);
          border-bottom: 1px solid rgba(255, 255, 255, 0.06);
        }

        .metric {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .metric-label {
          font-size: 11px;
          color: rgba(255, 255, 255, 0.4);
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .metric-value {
          font-size: 15px;
          font-weight: 500;
          color: #ffffff;
          font-family: 'JetBrains Mono', monospace;
        }

        .refundable-section {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 16px;
          margin: 16px 0;
          background: rgba(0, 255, 136, 0.05);
          border: 1px solid rgba(0, 255, 136, 0.15);
          border-radius: 12px;
        }

        .refundable-label {
          font-size: 14px;
          color: rgba(255, 255, 255, 0.7);
        }

        .refundable-amount {
          font-size: 24px;
          font-weight: 700;
          font-family: 'JetBrains Mono', monospace;
        }

        .reasoning-section {
          margin-top: 16px;
        }

        .reasoning-header {
          display: flex;
          align-items: center;
          gap: 8px;
          color: rgba(255, 255, 255, 0.5);
          font-size: 12px;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          margin-bottom: 8px;
        }

        .reasoning-text {
          font-size: 14px;
          color: rgba(255, 255, 255, 0.8);
          line-height: 1.6;
          margin: 0;
        }

        .rules-section {
          margin-top: 16px;
          border-top: 1px solid rgba(255, 255, 255, 0.06);
          padding-top: 16px;
        }

        .rules-toggle {
          display: flex;
          align-items: center;
          justify-content: space-between;
          width: 100%;
          padding: 8px 12px;
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 8px;
          color: rgba(255, 255, 255, 0.7);
          font-size: 13px;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .rules-toggle:hover {
          background: rgba(255, 255, 255, 0.05);
        }

        .rules-toggle svg {
          transition: transform 0.2s ease;
        }

        .rules-toggle svg.rotated {
          transform: rotate(180deg);
        }

        .rules-list {
          display: flex;
          flex-direction: column;
          gap: 8px;
          margin-top: 12px;
        }

        .rule-item {
          padding: 12px;
          background: rgba(255, 255, 255, 0.02);
          border-radius: 8px;
          border-left: 3px solid;
        }

        .rule-item.passed {
          border-left-color: rgba(0, 255, 136, 0.5);
        }

        .rule-item.failed.blocker {
          border-left-color: #ff6b9d;
        }

        .rule-item.failed.warning {
          border-left-color: #ffb347;
        }

        .rule-item.failed.info {
          border-left-color: #00d4ff;
        }

        .rule-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 4px;
        }

        .rule-code {
          font-family: 'JetBrains Mono', monospace;
          font-size: 11px;
          color: rgba(255, 255, 255, 0.5);
        }

        .rule-status {
          font-size: 11px;
          font-weight: 500;
        }

        .rule-status.passed {
          color: #00ff88;
        }

        .rule-status.failed {
          color: #ff6b9d;
        }

        .rule-title {
          font-size: 13px;
          font-weight: 500;
          color: #ffffff;
          margin-bottom: 4px;
        }

        .rule-message {
          font-size: 12px;
          color: rgba(255, 255, 255, 0.6);
        }

        .confidence-footer {
          display: flex;
          justify-content: flex-end;
          align-items: center;
          gap: 8px;
          margin-top: 16px;
          padding-top: 12px;
          border-top: 1px solid rgba(255, 255, 255, 0.06);
        }

        .confidence-label {
          font-size: 11px;
          color: rgba(255, 255, 255, 0.4);
        }

        .confidence-value {
          font-size: 12px;
          font-weight: 500;
          font-family: 'JetBrains Mono', monospace;
          color: #00d4ff;
        }

        @media (max-width: 640px) {
          .result-card {
            padding: 16px;
          }

          .card-header {
            flex-direction: column;
            gap: 12px;
          }

          .eligibility-badge {
            align-self: flex-start;
          }

          .metrics-grid {
            grid-template-columns: repeat(2, 1fr);
          }

          .refundable-section {
            flex-direction: column;
            gap: 8px;
            text-align: center;
          }
        }
      `}</style>
    </div>
  );
}
