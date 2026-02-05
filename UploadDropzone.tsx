'use client';

import React, { useCallback, useState } from 'react';
import { validateFile, ALLOWED_EXTENSIONS, MAX_FILE_SIZE } from '@/lib/vat-service';

interface UploadDropzoneProps {
  onFilesAdded: (files: File[]) => void;
  disabled?: boolean;
}

export function UploadDropzone({ onFilesAdded, disabled = false }: UploadDropzoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDragIn = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
      setIsDragging(true);
    }
  }, []);

  const handleDragOut = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);
      setError(null);

      if (disabled) return;

      const files = Array.from(e.dataTransfer.files);
      processFiles(files);
    },
    [disabled]
  );

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setError(null);
      if (disabled) return;

      const files = Array.from(e.target.files || []);
      processFiles(files);
      
      // Reset input so same file can be selected again
      e.target.value = '';
    },
    [disabled]
  );

  const processFiles = (files: File[]) => {
    const validFiles: File[] = [];
    const errors: string[] = [];

    files.forEach((file) => {
      const validation = validateFile(file);
      if (validation.valid) {
        validFiles.push(file);
      } else {
        errors.push(`${file.name}: ${validation.error}`);
      }
    });

    if (errors.length > 0) {
      setError(errors.join('\n'));
    }

    if (validFiles.length > 0) {
      onFilesAdded(validFiles);
    }
  };

  return (
    <div className="upload-dropzone-wrapper">
      <div
        className={`upload-dropzone ${isDragging ? 'dragging' : ''} ${disabled ? 'disabled' : ''}`}
        onDragEnter={handleDragIn}
        onDragLeave={handleDragOut}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <input
          type="file"
          multiple
          accept={ALLOWED_EXTENSIONS.map((ext) => `.${ext}`).join(',')}
          onChange={handleFileInput}
          disabled={disabled}
          className="file-input"
          id="file-upload"
        />
        
        <div className="dropzone-content">
          <div className="dropzone-icon">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M21 15V19C21 19.5304 20.7893 20.0391 20.4142 20.4142C20.0391 20.7893 19.5304 21 19 21H5C4.46957 21 3.96086 20.7893 3.58579 20.4142C3.21071 20.0391 3 19.5304 3 19V15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M17 8L12 3L7 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M12 3V15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          
          <div className="dropzone-text">
            <p className="dropzone-title">
              {isDragging ? 'Drop files here' : 'Drag & drop receipts here'}
            </p>
            <p className="dropzone-subtitle">
              or <label htmlFor="file-upload" className="browse-link">browse files</label>
            </p>
          </div>
          
          <div className="dropzone-info">
            <span>PDF, JPG, PNG, HEIC</span>
            <span className="separator">•</span>
            <span>Max {MAX_FILE_SIZE / 1024 / 1024}MB per file</span>
          </div>
        </div>
      </div>

      {error && (
        <div className="dropzone-error">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
            <path d="M12 8V12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            <circle cx="12" cy="16" r="1" fill="currentColor"/>
          </svg>
          <pre>{error}</pre>
        </div>
      )}

      <style jsx>{`
        .upload-dropzone-wrapper {
          width: 100%;
        }

        .upload-dropzone {
          position: relative;
          border: 2px dashed rgba(255, 255, 255, 0.15);
          border-radius: 16px;
          padding: 48px 32px;
          text-align: center;
          transition: all 0.3s ease;
          background: linear-gradient(180deg, rgba(255, 255, 255, 0.02) 0%, rgba(255, 255, 255, 0.01) 100%);
          cursor: pointer;
        }

        .upload-dropzone:hover:not(.disabled) {
          border-color: rgba(0, 212, 255, 0.4);
          background: linear-gradient(180deg, rgba(0, 212, 255, 0.05) 0%, rgba(123, 97, 255, 0.02) 100%);
        }

        .upload-dropzone.dragging {
          border-color: #00d4ff;
          background: linear-gradient(180deg, rgba(0, 212, 255, 0.1) 0%, rgba(123, 97, 255, 0.05) 100%);
          transform: scale(1.01);
        }

        .upload-dropzone.disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .file-input {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          opacity: 0;
          cursor: pointer;
        }

        .file-input:disabled {
          cursor: not-allowed;
        }

        .dropzone-content {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 16px;
          pointer-events: none;
        }

        .dropzone-icon {
          width: 72px;
          height: 72px;
          border-radius: 16px;
          background: linear-gradient(135deg, rgba(0, 212, 255, 0.15), rgba(123, 97, 255, 0.15));
          display: flex;
          align-items: center;
          justify-content: center;
          color: #00d4ff;
          transition: all 0.3s ease;
        }

        .upload-dropzone.dragging .dropzone-icon {
          transform: scale(1.1);
          background: linear-gradient(135deg, rgba(0, 212, 255, 0.25), rgba(123, 97, 255, 0.25));
        }

        .dropzone-text {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .dropzone-title {
          font-size: 18px;
          font-weight: 600;
          color: #ffffff;
          margin: 0;
        }

        .dropzone-subtitle {
          font-size: 14px;
          color: rgba(255, 255, 255, 0.6);
          margin: 0;
        }

        .browse-link {
          color: #00d4ff;
          cursor: pointer;
          text-decoration: underline;
          text-underline-offset: 2px;
          pointer-events: auto;
        }

        .browse-link:hover {
          color: #7b61ff;
        }

        .dropzone-info {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 12px;
          color: rgba(255, 255, 255, 0.4);
        }

        .separator {
          color: rgba(255, 255, 255, 0.2);
        }

        .dropzone-error {
          display: flex;
          align-items: flex-start;
          gap: 8px;
          margin-top: 12px;
          padding: 12px 16px;
          background: rgba(255, 107, 157, 0.1);
          border: 1px solid rgba(255, 107, 157, 0.3);
          border-radius: 8px;
          color: #ff6b9d;
          font-size: 13px;
        }

        .dropzone-error svg {
          flex-shrink: 0;
          margin-top: 2px;
        }

        .dropzone-error pre {
          margin: 0;
          font-family: inherit;
          white-space: pre-wrap;
          text-align: left;
        }

        @media (max-width: 640px) {
          .upload-dropzone {
            padding: 32px 20px;
          }

          .dropzone-icon {
            width: 56px;
            height: 56px;
          }

          .dropzone-icon svg {
            width: 32px;
            height: 32px;
          }

          .dropzone-title {
            font-size: 16px;
          }

          .dropzone-info {
            flex-direction: column;
            gap: 4px;
          }

          .separator {
            display: none;
          }
        }
      `}</style>
    </div>
  );
}
