import React from 'react';

const LoadingSpinner = ({ 
  size = 'md',
  className = '',
  color = 'primary'
}) => {
  const sizeClasses = {
    sm: 'w-4 h-4 border-2',
    md: 'w-6 h-6 border-2',
    lg: 'w-8 h-8 border-3',
    xl: 'w-10 h-10 border-3',
  };

  return (
    <div className={`loading-spinner ${className}`} role="status" aria-label="Loading">
      <span className="sr-only">Loading...</span>
    </div>
  );
};

const LoadingOverlay = ({ 
  visible = true,
  message = 'Loading...',
  size = 'md'
}) => {
  if (!visible) return null;

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="card p-6 lg:p-8 shadow-lg text-center max-w-sm mx-4">
        <LoadingSpinner size={size} className="mx-auto mb-4" />
        <p className="text-text-secondary">{message}</p>
      </div>
    </div>
  );
};

const LoadingCard = ({ 
  visible = true,
  className = '',
  lines = 3 
}) => {
  if (!visible) return null;

  return (
    <div className={`space-y-3 ${className}`}>
      {[...Array(lines)].map((_, i) => (
        <div key={i} className="skeleton-loader" />
      ))}
    </div>
  );
};

LoadingSpinner.Overlay = LoadingOverlay;
LoadingSpinner.Card = LoadingCard;

export default LoadingSpinner;