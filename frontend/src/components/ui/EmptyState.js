import React from 'react';

const EmptyState = ({ 
  icon,
  title = 'No data available',
  description = 'There is nothing to show here.',
  action,
  className = '',
  illustration = 'default'
}) => {
  const illustrations = {
    default: '📭',
    search: '🔍',
    filter: '🔎',
    offline: '📡',
    error: '⚠️',
    success: '✅',
    hospital: '🏥',
    ambulance: '🚑',
    patient: '👤',
    emergency: '🚨',
    traffic: '🚦',
    history: '📜',
    settings: '⚙️',
  };

  return (
    <div className={`empty-state ${className}`}>
      <div className="empty-state-icon">{icon || illustrations[illustration]}</div>
      <h3 className="empty-state-title">{title}</h3>
      <p className="empty-state-description">{description}</p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
};

export default EmptyState;