'use client';

import React from 'react';
import { QueuedFile, ProcessingStatus } from '@/lib/vat-service';

interface ReceiptQueueItemProps {
  item: QueuedFile;
  onRemove: (id: string) => void;
  disabled?: boolean;
}

const STATUS_CONFIG: Record<ProcessingStatus, { label: string; color: string; bgColor: string }> = {
  queued: { label: 'Queued', color: 'rgba(255, 255, 255, 0.6)', bgColor: 'rgba(255, 255, 255, 0.05)' },
  uploading: { label: 'Uploading', color: '#00d4ff', bgColor: 'rgba(0, 212, 255, 0.1)' },
  processing_ocr: { label: 'Processing OCR', color: '#00d4ff', bgColor: 'rgba(0, 212, 255, 0.1)' },
  running_rules: { label: 'Running Rules', color: '#7b61ff', bgColor: 'rgba(123, 97, 255, 0.1)' },
  done: { label: 'Complete', color: '#00ff88', bgColor: 'rgba(0, 255, 136, 0.1)' },
  error: { label: 'Error', color: '#ff6b9d', bgColor: 'rgba(255, 107, 157, 0.1)' },
};

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function getFileIcon(type: string): React.ReactNode {
  if (type.includes('pdf')) {
    return (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M14 2H6C5.46957 2 4.96086 2.21071 4.58579 2.58579C4.21071 2.96086 4 3.46957 4 4V20C4 20.5304 4.21071 21.0391 4.58579 21.4142C4.96086 21.7893 5.46957 22 6 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V8L14 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M14 2V8H20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    );
  }
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="3" y="3" width="18" height="18" rx="2" ry="2" stroke="currentColor" strokeWidth="2"/>
      <circle cx="8.5" cy="8.5" r="1.5" fill="currentColor"/>
      <path d="M21 15L16 10L5 21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

export function ReceiptQueueItem({ item, onRemove, disabled = false }: ReceiptQueueItemProps) {
  const statusConfig = STATUS_CONFIG[item.status];
  const isProcessing = ['uploading', 'processing_ocr', 'running_rules'].includes(item.status);
  const canRemove = !isProcessing && !disabled;

  return (
    <div className={`queue-item ${item.status}`}>
      <div className="item-icon">
        {getFileIcon(item.file.type)}
      </div>

      <div className="item-info">
        <div className="item-name" title={item.file.name}>
          {item.file.name}
        </div>
        <div className="item-meta">
          <span className="item-type">{item.file.type.split('/')[1]?.toUpperCase() || 'FILE'}</span>
          <span className="meta-separator">•</span>
          <span className="item-size">{formatFileSize(item.file.size)}</span>
        </div>
      </div>

      <div className="item-status">
        <div 
          className="status-badge"
          style={{ 
            color: statusConfig.color, 
            backgroundColor: statusConfig.bgColor 
          }}
        >
          {isProcessing && <span className="status-spinner" />}
          {statusConfig.label}
        </div>
        {item.error && (
          <div className="status-error" title={item.error}>
            {item.error.length > 30 ? item.error.substring(0, 30) + '...' : item.error}
          </div>
        )}
      </div>

      {isProcessing && (
        <div className="progress-bar">
          <div 
            className="progress-fill"
            style={{ width: `${item.progress}%` }}
          />
        </div>
      )}

      <button 
        className="remove-btn"
        onClick={() => onRemove(item.id)}
        disabled={!canRemove}
        title={canRemove ? 'Remove' : 'Cannot remove while processing'}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>

      <style jsx>{`
        .queue-item {
          display: grid;
          grid-template-columns: 44px 1fr auto auto;
          gap: 16px;
          align-items: center;
          padding: 16px;
          background: rgba(255, 255, 255, 0.02);
          border: 1px solid rgba(255, 255, 255, 0.06);
          border-radius: 12px;
          position: relative;
          overflow: hidden;
          transition: all 0.2s ease;
        }

        .queue-item:hover {
          background: rgba(255, 255, 255, 0.04);
          border-color: rgba(255, 255, 255, 0.1);
        }

        .queue-item.done {
          border-color: rgba(0, 255, 136, 0.2);
        }

        .queue-item.error {
          border-color: rgba(255, 107, 157, 0.2);
        }

        .item-icon {
          width: 44px;
          height: 44px;
          border-radius: 10px;
          background: rgba(255, 255, 255, 0.05);
          display: flex;
          align-items: center;
          justify-content: center;
          color: rgba(255, 255, 255, 0.6);
        }

        .queue-item.done .item-icon {
          background: rgba(0, 255, 136, 0.1);
          color: #00ff88;
        }

        .queue-item.error .item-icon {
          background: rgba(255, 107, 157, 0.1);
          color: #ff6b9d;
        }

        .item-info {
          min-width: 0;
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .item-name {
          font-size: 14px;
          font-weight: 500;
          color: #ffffff;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .item-meta {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 12px;
          color: rgba(255, 255, 255, 0.4);
        }

        .meta-separator {
          color: rgba(255, 255, 255, 0.2);
        }

        .item-status {
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          gap: 4px;
        }

        .status-badge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 6px 12px;
          border-radius: 20px;
          font-size: 12px;
          font-weight: 500;
          white-space: nowrap;
        }

        .status-spinner {
          width: 12px;
          height: 12px;
          border: 2px solid currentColor;
          border-right-color: transparent;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        .status-error {
          font-size: 11px;
          color: #ff6b9d;
          max-width: 150px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .progress-bar {
          position: absolute;
          bottom: 0;
          left: 0;
          right: 0;
          height: 3px;
          background: rgba(255, 255, 255, 0.05);
        }

        .progress-fill {
          height: 100%;
          background: linear-gradient(90deg, #00d4ff, #7b61ff);
          transition: width 0.3s ease;
        }

        .remove-btn {
          width: 32px;
          height: 32px;
          border: none;
          border-radius: 8px;
          background: transparent;
          color: rgba(255, 255, 255, 0.4);
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s ease;
        }

        .remove-btn:hover:not(:disabled) {
          background: rgba(255, 107, 157, 0.1);
          color: #ff6b9d;
        }

        .remove-btn:disabled {
          opacity: 0.3;
          cursor: not-allowed;
        }

        @media (max-width: 640px) {
          .queue-item {
            grid-template-columns: 36px 1fr auto;
            gap: 12px;
            padding: 12px;
          }

          .item-icon {
            width: 36px;
            height: 36px;
          }

          .item-status {
            grid-column: 2 / 4;
            grid-row: 2;
            align-items: flex-start;
          }

          .remove-btn {
            position: absolute;
            top: 8px;
            right: 8px;
          }
        }
      `}</style>
    </div>
  );
}
