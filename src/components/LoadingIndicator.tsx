import './LoadingIndicator.css';

interface LoadingIndicatorProps {
  message?: string;
}

export function LoadingIndicator({ message = 'Generating...' }: LoadingIndicatorProps) {
  return (
    <div className="loading-container">
      <div className="loading-spinner"></div>
      <p className="loading-message">{message}</p>
    </div>
  );
}
