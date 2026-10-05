import React from 'react';
import { Card, Badge, Button } from '../ui';

const HospitalCard = ({ 
  hospital,
  onClick,
  showDistance = true,
  showResources = true,
  showStatus = true,
  variant = 'default',
  className = ''
}) => {
  const { 
    name, 
    code, 
    area, 
    address, 
    contact, 
    hospitalType, 
    status, 
    currentLoad, 
    resources,
    details,
    location,
    distance,
    rating
  } = hospital;

  const getStatusConfig = (status) => {
    switch (status) {
      case 'operational': return { variant: 'success', label: 'Operational' };
      case 'maintenance': return { variant: 'warning', label: 'Maintenance' };
      case 'offline': return { variant: 'error', label: 'Offline' };
      case 'emergency_only': return { variant: 'warning', label: 'Emergency Only' };
      default: return { variant: 'default', label: status };
    }
  };

  const statusConfig = getStatusConfig(status);

  const formatDistance = (dist) => {
    if (!dist && dist !== 0) return null;
    return dist < 1 ? `${Math.round(dist * 1000)} m` : `${dist.toFixed(1)} km`;
  };

  const getResourceSummary = () => {
    if (!resources) return null;
    const { beds, equipment, emergencyCapacity } = resources;
    return {
      totalBeds: beds?.total || 0,
      availableBeds: beds?.available || 0,
      icuAvailable: beds?.icuAvailable || 0,
      ventilatorsAvailable: equipment?.ventilatorsAvailable || 0,
      emergencyLoad: emergencyCapacity?.currentLoad || 'UNKNOWN',
      acceptingPatients: emergencyCapacity?.acceptingEmergencyPatients !== false,
    };
  };

  const resourceSummary = getResourceSummary();

  const handleClick = () => {
    if (onClick) onClick(hospital);
  };

  if (variant === 'compact') {
    return (
      <div 
        className={`hospital-card-compact ${className}`}
        onClick={handleClick}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => e.key === 'Enter' && handleClick()}
      >
        <div className="hospital-card-icon">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 14l2-2-3-3.5-3 3.5 2 2zm0 0l4-2M5 19l5-5 5 5" />
          </svg>
        </div>
        <div className="hospital-card-info">
          <h4 className="hospital-card-name">{name}</h4>
          <p className="hospital-card-location">
            {address?.street}, {address?.city} • {area}
          </p>
        </div>
        <div className="hospital-card-meta">
          <Badge variant={statusConfig.variant} size="sm" dot>{statusConfig.label}</Badge>
          {showDistance && distance !== undefined && (
            <span className="hospital-card-distance">{formatDistance(distance)}</span>
          )}
        </div>
      </div>
    );
  }

  return (
    <Card 
      className={`hospital-card ${onClick ? 'hospital-card-clickable' : ''} ${className}`}
      onClick={handleClick}
      onKeyDown={(e) => e.key === 'Enter' && handleClick()}
      tabIndex={onClick ? 0 : undefined}
      role={onClick ? 'button' : undefined}
    >
      <Card.Header>
        <div className="hospital-card-header">
          <div className="hospital-card-main">
            <div className="hospital-card-title-row">
              <h3 className="hospital-card-name">{name}</h3>
              {code && <Badge variant="primary" size="sm">{code}</Badge>}
            </div>
            <div className="hospital-card-details">
              <span>{hospitalType}</span>
              <span className="separator">•</span>
              <span>{address?.street}, {address?.city}</span>
              <span className="separator">•</span>
              <span>{area}</span>
            </div>
          </div>
          <div className="hospital-card-badges">
            {showStatus && <Badge variant={statusConfig.variant} dot>{statusConfig.label}</Badge>}
            {showDistance && distance !== undefined && (
              <Badge variant="info" size="sm" icon="📍">{formatDistance(distance)}</Badge>
            )}
            {rating && (
              <Badge variant="warning" size="sm" icon="⭐">{rating.toFixed(1)}</Badge>
            )}
          </div>
        </div>
      </Card.Header>

      <Card.Body>
        <div className="hospital-card-resources">
          {resourceSummary && showResources && (
            <>
              <div className="resource-stat">
                <p className="resource-stat-value text-primary">{resourceSummary.availableBeds}</p>
                <p className="resource-stat-label">Beds Available</p>
              </div>
              <div className="resource-stat">
                <p className="resource-stat-value text-success">{resourceSummary.icuAvailable}</p>
                <p className="resource-stat-label">ICU Available</p>
              </div>
              <div className="resource-stat">
                <p className="resource-stat-value text-warning">{resourceSummary.ventilatorsAvailable}</p>
                <p className="resource-stat-label">Ventilators</p>
              </div>
              <div className={`resource-stat ${resourceSummary.acceptingPatients ? '' : 'resource-stat-unavailable'}`}>
                <p className="resource-stat-value">{resourceSummary.acceptingPatients ? '✓' : '✕'}</p>
                <p className="resource-stat-label">Accepting Patients</p>
              </div>
            </>
          )}
        </div>

        {contact && (
          <div className="hospital-card-contact">
            <span className="contact-item">
              <svg className="contact-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
              </svg>
              {contact.phone}
            </span>
            {contact.emergency && (
              <span className="contact-item contact-emergency">
                <svg className="contact-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Emergency: {contact.emergency}
              </span>
            )}
          </div>
        )}

        {details?.specialties?.length && (
          <div className="hospital-card-specialties">
            <p className="specialties-label">Specialties:</p>
            <div className="specialties-list">
              {details.specialties.slice(0, 4).map((specialty, index) => (
                <Badge key={index} variant="info" size="sm">{specialty}</Badge>
              ))}
              {details.specialties.length > 4 && (
                <Badge variant="default" size="sm">+{details.specialties.length - 4} more</Badge>
              )}
            </div>
          </div>
        )}
      </Card.Body>

      {onClick && (
        <Card.Footer divided={false}>
          <Button variant="outline" size="sm" className="w-full sm:w-auto">
            View Details
          </Button>
        </Card.Footer>
      )}
    </Card>
  );
};

export default HospitalCard;