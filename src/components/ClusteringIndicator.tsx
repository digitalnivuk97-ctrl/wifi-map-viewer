import './ClusteringIndicator.css';

interface ClusteringIndicatorProps {
  isVisible: boolean;
}

export default function ClusteringIndicator({ isVisible }: ClusteringIndicatorProps) {
  if (!isVisible) return null;

  return (
    <div className="clustering-indicator">
      <span className="clustering-indicator-icon">ℹ️</span>
      <span className="clustering-indicator-text">
        Clustering enabled for performance (zoom in to disable)
      </span>
    </div>
  );
}
