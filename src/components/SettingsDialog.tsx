import { useState, useEffect } from 'react';
import './SettingsDialog.css';

interface SettingsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  clusteringEnabled: boolean;
  onClusteringToggle: (enabled: boolean) => void;
  autoClusterZoomThreshold: number;
  onThresholdChange: (threshold: number) => void;
}

export default function SettingsDialog({
  isOpen,
  onClose,
  clusteringEnabled,
  onClusteringToggle,
  autoClusterZoomThreshold,
  onThresholdChange,
}: SettingsDialogProps) {
  // Local state for form values (to support Cancel functionality)
  const [localClusteringEnabled, setLocalClusteringEnabled] = useState(clusteringEnabled);
  const [localThreshold, setLocalThreshold] = useState(autoClusterZoomThreshold);

  // Sync local state with props when dialog opens
  useEffect(() => {
    if (isOpen) {
      setLocalClusteringEnabled(clusteringEnabled);
      setLocalThreshold(autoClusterZoomThreshold);
    }
  }, [isOpen, clusteringEnabled, autoClusterZoomThreshold]);

  if (!isOpen) return null;

  const handleSave = () => {
    // Apply changes to parent state
    onClusteringToggle(localClusteringEnabled);
    onThresholdChange(localThreshold);
    onClose();
  };

  const handleCancel = () => {
    // Discard changes and close
    setLocalClusteringEnabled(clusteringEnabled);
    setLocalThreshold(autoClusterZoomThreshold);
    onClose();
  };

  return (
    <div className="settings-dialog-overlay" onClick={handleCancel}>
      <div className="settings-dialog" onClick={(e) => e.stopPropagation()}>
        <div className="settings-dialog-header">
          <h2>Settings</h2>
          <button
            className="close-button"
            onClick={handleCancel}
            aria-label="Close dialog"
          >
            ×
          </button>
        </div>

        <div className="settings-dialog-content">
          {/* Map Settings Section */}
          <div className="settings-section">
            <h3 className="settings-section-header">Map Settings</h3>

            {/* Clustering Toggle */}
            <div className="settings-item">
              <label className="settings-toggle-label">
                <div className="settings-label-text">
                  <span className="settings-label-title">Enable Marker Clustering</span>
                  <span className="settings-label-description">
                    Groups nearby markers for better performance with large datasets
                  </span>
                </div>
                <div className="toggle-switch">
                  <input
                    type="checkbox"
                    checked={localClusteringEnabled}
                    onChange={(e) => setLocalClusteringEnabled(e.target.checked)}
                    id="settings-clustering-toggle"
                  />
                  <label htmlFor="settings-clustering-toggle" className="toggle-slider"></label>
                </div>
              </label>
            </div>

            {/* Zoom Threshold Slider */}
            <div className="settings-item">
              <label htmlFor="threshold-slider" className="settings-label">
                <span className="settings-label-title">
                  Auto-cluster zoom threshold: {localThreshold}
                </span>
                <span className="settings-label-description">
                  Clustering is forced below this zoom level for performance
                </span>
              </label>
              <input
                id="threshold-slider"
                type="range"
                min="1"
                max="20"
                value={localThreshold}
                onChange={(e) => setLocalThreshold(Number(e.target.value))}
                className="threshold-slider"
              />
              <div className="slider-labels">
                <span>1 (World)</span>
                <span>20 (Street)</span>
              </div>
            </div>
          </div>
        </div>

        <div className="settings-dialog-actions">
          <button className="button button-secondary" onClick={handleCancel}>
            Cancel
          </button>
          <button className="button button-primary" onClick={handleSave}>
            Save
          </button>
        </div>
      </div>
    </div>
  );
}
