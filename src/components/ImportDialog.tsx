import { useState } from 'react';
import { ImportResult } from '../types/network';
import { ImportError, ParseError, DatabaseError } from '../utils/errors';
import { logger } from '../utils/logger';
import './ImportDialog.css';

interface ImportDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (filePath: string) => Promise<ImportResult>;
}

export default function ImportDialog({ isOpen, onClose, onImport }: ImportDialogProps) {
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [detectedFormat, setDetectedFormat] = useState<string | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [progressMessage, setProgressMessage] = useState('');
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSelectFile = async () => {
    try {
      // Check if electronAPI is available
      console.log('window.electronAPI:', window.electronAPI);
      console.log('window keys:', Object.keys(window));
      
      if (!window.electronAPI) {
        throw new Error('Electron API not available. Please ensure the application is running in Electron.');
      }

      console.log('Calling selectImportFile...');
      // Use Electron dialog API to select file
      const result = await window.electronAPI?.selectImportFile();
      
      if (result.canceled || !result.filePath) {
        return;
      }

      setSelectedFile(result.filePath);
      setDetectedFormat(result.format || 'Detecting...');
      setImportResult(null);
      setError(null);
    } catch (err) {
      setError(`Failed to select file: ${err instanceof Error ? err.message : String(err)}`);
      logger.error('Failed to select import file', err instanceof Error ? err : new Error(String(err)));
    }
  };

  const handleImport = async () => {
    if (!selectedFile) return;

    setIsImporting(true);
    setProgress(0);
    setProgressMessage('Starting import...');
    setError(null);
    setImportResult(null);

    // Set up progress listener if available
    if ((window as any).electronAPI?.onImportProgress) {
      (window as any).electronAPI.onImportProgress((prog: number, msg: string) => {
        setProgress(prog);
        setProgressMessage(msg);
      });
    }

    try {
      const result = await onImport(selectedFile);
      setImportResult(result);
      setProgress(100);
      setProgressMessage('Import complete!');
    } catch (err) {
      logger.error('Import error in dialog', err instanceof Error ? err : new Error(String(err)));
      
      // Provide user-friendly error messages based on error type
      let errorMessage = 'Import failed: ';
      
      if (err instanceof ParseError) {
        errorMessage += `Unable to parse file. ${err.message}`;
        if (err.line) {
          errorMessage += ` (Line ${err.line})`;
        }
      } else if (err instanceof DatabaseError) {
        errorMessage += `Database error. ${err.message}`;
      } else if (err instanceof ImportError) {
        errorMessage += err.message;
      } else {
        errorMessage += err instanceof Error ? err.message : String(err);
      }
      
      setError(errorMessage);
    } finally {
      setIsImporting(false);
      // Clean up progress listener
      if ((window as any).electronAPI?.removeImportProgressListener) {
        (window as any).electronAPI.removeImportProgressListener();
      }
    }
  };

  const handleClose = () => {
    if (!isImporting) {
      setSelectedFile(null);
      setDetectedFormat(null);
      setProgress(0);
      setProgressMessage('');
      setImportResult(null);
      setError(null);
      onClose();
    }
  };

  const handleNewImport = () => {
    setSelectedFile(null);
    setDetectedFormat(null);
    setProgress(0);
    setProgressMessage('');
    setImportResult(null);
    setError(null);
  };

  return (
    <div className="import-dialog-overlay" onClick={handleClose}>
      <div className="import-dialog" onClick={(e) => e.stopPropagation()}>
        <div className="import-dialog-header">
          <h2>Import WiFi Networks</h2>
          <button 
            className="close-button" 
            onClick={handleClose}
            disabled={isImporting}
            aria-label="Close dialog"
          >
            ×
          </button>
        </div>

        <div className="import-dialog-content">
          {!importResult && !error && (
            <>
              <div className="file-selection">
                <button 
                  className="select-file-button"
                  onClick={handleSelectFile}
                  disabled={isImporting}
                >
                  {selectedFile ? 'Change File' : 'Select File'}
                </button>
                
                {selectedFile && (
                  <div className="selected-file-info">
                    <div className="file-path" title={selectedFile}>
                      {selectedFile.split(/[\\/]/).pop()}
                    </div>
                    {detectedFormat && (
                      <div className="detected-format">
                        Format: <strong>{detectedFormat}</strong>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {isImporting && (
                <div className="progress-section">
                  <div className="progress-bar-container">
                    <div 
                      className="progress-bar-fill" 
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                  <div className="progress-message">{progressMessage}</div>
                  <div className="progress-percentage">{Math.round(progress)}%</div>
                </div>
              )}

              <div className="dialog-actions">
                <button 
                  className="button button-secondary"
                  onClick={handleClose}
                  disabled={isImporting}
                >
                  Cancel
                </button>
                <button 
                  className="button button-primary"
                  onClick={handleImport}
                  disabled={!selectedFile || isImporting}
                >
                  {isImporting ? 'Importing...' : 'Import'}
                </button>
              </div>
            </>
          )}

          {importResult && (
            <div className="import-results">
              <div className="results-header">
                <svg className="success-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <h3>Import Complete</h3>
              </div>

              <div className="results-summary">
                <div className="result-item">
                  <span className="result-label">Networks Imported:</span>
                  <span className="result-value">{importResult.networksImported}</span>
                </div>
                <div className="result-item">
                  <span className="result-label">Networks Updated:</span>
                  <span className="result-value">{importResult.networksUpdated}</span>
                </div>
                <div className="result-item">
                  <span className="result-label">Observations Added:</span>
                  <span className="result-value">{importResult.observationsAdded}</span>
                </div>
                {importResult.errors.length > 0 && (
                  <div className="result-item errors">
                    <span className="result-label">Errors:</span>
                    <span className="result-value error-count">{importResult.errors.length}</span>
                  </div>
                )}
              </div>

              {importResult.errors.length > 0 && (
                <div className="error-list">
                  <details>
                    <summary>View Errors ({importResult.errors.length})</summary>
                    <ul>
                      {importResult.errors.slice(0, 10).map((error, index) => (
                        <li key={index}>{error}</li>
                      ))}
                      {importResult.errors.length > 10 && (
                        <li className="more-errors">
                          ... and {importResult.errors.length - 10} more errors
                        </li>
                      )}
                    </ul>
                  </details>
                </div>
              )}

              <div className="dialog-actions">
                <button 
                  className="button button-secondary"
                  onClick={handleNewImport}
                >
                  Import Another File
                </button>
                <button 
                  className="button button-primary"
                  onClick={handleClose}
                >
                  Done
                </button>
              </div>
            </div>
          )}

          {error && (
            <div className="import-error">
              <div className="error-header">
                <svg className="error-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
                <h3>Import Failed</h3>
              </div>
              <p className="error-message">{error}</p>
              <div className="dialog-actions">
                <button 
                  className="button button-secondary"
                  onClick={handleNewImport}
                >
                  Try Again
                </button>
                <button 
                  className="button button-primary"
                  onClick={handleClose}
                >
                  Close
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
