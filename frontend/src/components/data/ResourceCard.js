import React from 'react';
import { Card, Badge, Button } from '../ui';

const ResourceCard = ({ 
  resource,
  onClick,
  variant = 'default',
  className = ''
}) => {
  const { 
    type,
    name,
    label,
    value,
    total,
    available,
    occupied,
    reserved,
    unit,
    status,
    trend,
    icon,
    color = 'primary',
    description,
    lastUpdated
  } = resource;

  const getStatusConfig = (status) => {
    switch (status) {
      case 'available': return { variant: 'success', label: 'Available' };
      case 'limited': return { variant: 'warning', label: 'Limited' };
      case 'unavailable': return { variant: 'error', label: 'Unavailable' };
      case 'critical': return { variant: 'error', label: 'Critical' };
      case 'normal': return { variant: 'success', label: 'Normal' };
      default: return { variant: 'default', label: status || 'Unknown' };
    }
  };

  const statusConfig = getStatusConfig(status);

  const getPercentage = () => {
    if (total && total > 0) {
      return Math.round(((available || 0) / total) * 100);
    }
    return null;
  };

  const percentage = getPercentage();

  const handleClick = () => {
    if (onClick) onClick(resource);
  };

  const icons = {
    beds: '🛏️',
    icu: '🏥',
    ventilators: '🫁',
    blood: '🩸',
    staff: '👨‍⚕️',
    equipment: '🔧',
    oxygen: '💨',
    theatres: '🏥',
    default: '📦',
  };

  if (variant === 'compact') {
    return (
      <div 
        className={`resource-card-compact ${className}`}
        onClick={handleClick}
      >
        <div className="resource-card-icon">
          <span className="text-xl">{icon || icons[type] || icons.default}</span>
        </div>
        <div className="resource-card-info">
          <p className="resource-card-name">{label || name}</p>
          <p className="resource-card-value">
            {value !== undefined ? `${value} ${unit || ''}` : available !== undefined ? `${available}/${total} available` : 'N/A'}
          </p>
        </div>
        <Badge variant={statusConfig.variant} size="sm" dot>{statusConfig.label}</Badge>
      </div>
    );
  }

  if (variant === 'stat') {
    return (
      <Card className={`${className}`}>
        <Card.Body className="text-center">
          <div className={`resource-stat-icon ${color}-light`}>
            <span>{icon || icons[type] || icons.default}</span>
          </div>
          <p className="resource-stat-value text-text-primary">
            {value !== undefined ? `${value}${unit ? ` ${unit}` : ''}` : available !== undefined ? `${available}` : '—'}
          </p>
          <p className="resource-stat-label">{label || name}</p>
          {total && (
            <p className="resource-stat-label">
              {available} of {total} available ({percentage}%)
            </p>
          )}
          {trend && (
            <div className={`resource-trend ${trend > 0 ? 'text-success' : trend < 0 ? 'text-error' : 'text-text-secondary'}`}>
              <span>{trend > 0 ? '↑' : trend < 0 ? '↓' : '→'}</span>
              <span>{Math.abs(trend)}%</span>
              <span className="text-text-secondary">vs last hour</span>
            </div>
          )}
          {status && <Badge variant={statusConfig.variant} size="sm" className="resource-badge">{statusConfig.label}</Badge>}
        </Card.Body>
      </Card>
    );
  }

  return (
    <Card className={`resource-card ${onClick ? 'resource-card-clickable' : ''} ${className}`} onClick={handleClick}>
      <Card.Header>
        <div className="resource-card-header">
          <div className="resource-card-main">
            <div className={`resource-card-icon ${color}-light`}>
              <span className="text-xl">{icon || icons[type] || icons.default}</span>
            </div>
            <div>
              <h3 className="resource-card-name">{label || name}</h3>
              {description && <p className="resource-card-description">{description}</p>}
            </div>
          </div>
          <div className="resource-card-badges">
            {status && <Badge variant={statusConfig.variant} dot>{statusConfig.label}</Badge>}
            {trend !== undefined && (
              <Badge variant={trend > 0 ? 'success' : trend < 0 ? 'error' : 'default'} size="sm">
                {trend > 0 ? '↑' : trend < 0 ? '↓' : '→'} {Math.abs(trend)}%
              </Badge>
            )}
          </div>
        </div>
      </Card.Header>

      <Card.Body>
        <div className="resource-card-stats">
          {value !== undefined && (
            <div className="resource-stat-item">
              <p className="resource-stat-value text-text-primary">{value}</p>
              <p className="resource-stat-label">{unit || 'units'}</p>
            </div>
          )}
          {total !== undefined && (
            <div className="resource-stat-item">
              <p className="resource-stat-value text-text-primary">{total}</p>
              <p className="resource-stat-label">Total Capacity</p>
            </div>
          )}
          {available !== undefined && (
            <div className="resource-stat-item">
              <p className="resource-stat-value text-success">{available}</p>
              <p className="resource-stat-label">Available</p>
            </div>
          )}
          {occupied !== undefined && (
            <div className="resource-stat-item">
              <p className="resource-stat-value text-warning">{occupied}</p>
              <p className="resource-stat-label">Occupied</p>
            </div>
          )}
          {reserved !== undefined && (
            <div className="resource-stat-item">
              <p className="resource-stat-value text-primary">{reserved}</p>
              <p className="resource-stat-label">Reserved</p>
            </div>
          )}
          {percentage !== null && (
            <div className="resource-stat-item">
              <p className="resource-stat-value text-text-primary">{percentage}%</p>
              <p className="resource-stat-label">Availability</p>
            </div>
          )}
        </div>

        {(total && available !== undefined) && (
          <div className="resource-progress">
            <div className="resource-progress-header">
              <span className="text-text-secondary">Availability</span>
              <span className="font-medium">{percentage}%</span>
            </div>
            <div className="resource-progress-bar">
              <div 
                className={`resource-progress-fill ${percentage > 50 ? 'bg-success' : percentage > 20 ? 'bg-warning' : 'bg-error'}`}
                style={{ width: `${percentage}%` }}
              />
            </div>
          </div>
        )}

        {lastUpdated && (
          <p className="resource-last-updated">
            Last updated: {new Date(lastUpdated).toLocaleTimeString()}
          </p>
        )}
      </Card.Body>
    </Card>
  );
};

export default ResourceCard;