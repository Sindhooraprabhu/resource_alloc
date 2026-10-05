import React from 'react';
import { Card, Badge } from '../ui';

const VitalsDisplay = ({ 
  vitals,
  patientId,
  showTrends = false,
  showStatus = true,
  compact = false,
  onVitalClick,
  className = ''
}) => {
  const vitalConfig = [
    { key: 'heartRate', label: 'Heart Rate', unit: 'bpm', icon: '❤️', color: 'error', 
      thresholds: { low: 60, high: 100 }, precision: 0 },
    { key: 'spo2', label: 'SpO₂', unit: '%', icon: '🫁', color: 'success',
      thresholds: { low: 95, high: 100 }, precision: 0 },
    { key: 'temperature', label: 'Temperature', unit: '°F', icon: '🌡️', color: 'warning',
      thresholds: { low: 97, high: 99.5 }, precision: 1 },
    { key: 'systolic', label: 'Systolic BP', unit: 'mmHg', icon: '💓', color: 'primary',
      thresholds: { low: 90, high: 140 }, precision: 0, pair: 'diastolic' },
    { key: 'diastolic', label: 'Diastolic BP', unit: 'mmHg', icon: '💓', color: 'primary',
      thresholds: { low: 60, high: 90 }, precision: 0 },
    { key: 'respiratoryRate', label: 'Resp. Rate', unit: 'rpm', icon: '🫁', color: 'info',
      thresholds: { low: 12, high: 20 }, precision: 0 },
    { key: 'bloodGlucose', label: 'Glucose', unit: 'mg/dL', icon: '🩸', color: 'warning',
      thresholds: { low: 70, high: 180 }, precision: 0 },
    { key: 'perfusionIndex', label: 'Perfusion Index', unit: 'kPa', icon: '📊', color: 'secondary',
      thresholds: { low: 1.4, high: 10 }, precision: 1 },
  ];

  const getVitalStatus = (value, config) => {
    if (value === undefined || value === null) return { status: 'unknown', label: 'N/A' };
    if (value < config.thresholds.low) return { status: 'low', label: 'Low' };
    if (value > config.thresholds.high) return { status: 'high', label: 'High' };
    return { status: 'normal', label: 'Normal' };
  };

  const getStatusVariant = (status) => {
    switch (status) {
      case 'low': return 'warning';
      case 'high': return 'error';
      case 'normal': return 'success';
      default: return 'default';
    }
  };

  const formatValue = (value, config) => {
    if (value === undefined || value === null) return '—';
    return config.precision > 0 ? value.toFixed(config.precision) : Math.round(value);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'low': return 'text-warning';
      case 'high': return 'text-error';
      case 'normal': return 'text-success';
      default: return 'text-text-secondary';
    }
  };

  if (compact) {
    return (
      <div className={`vitals-grid ${className}`}>
        {vitalConfig.map((config) => {
          const value = vitals[config.key];
          const status = getVitalStatus(value, config);
          return (
            <div 
              key={config.key}
              className="vital-card"
              onClick={() => onVitalClick?.(config.key, value, vitals)}
            >
              <div className="vital-icon">{config.icon}</div>
              <div className="vital-label">{config.label}</div>
              <div className={`vital-value ${getStatusColor(status.status)}`}>
                {formatValue(value, config)}
              </div>
              <div className="vital-unit">{config.unit}</div>
              {showStatus && (
                <Badge variant={getStatusVariant(status.status)} size="sm" className="vital-badge">
                  {status.label}
                </Badge>
              )}
            </div>
          );
        })}
      </div>
    );
  }

  return (
    <div className={className}>
      <div className="vitals-grid">
        {vitalConfig.map((config) => {
          const value = vitals[config.key];
          const status = getVitalStatus(value, config);
          const isPaired = config.pair && vitals[config.pair] !== undefined;

          return (
            <Card key={config.key} className={onVitalClick ? 'vital-card-hover' : ''} onClick={() => onVitalClick?.(config.key, value, vitals)}>
              <Card.Body className="vital-card-body">
                <div className="vital-icon-large">
                  <span className="text-2xl">{config.icon}</span>
                </div>
                <h4 className="vital-label">{config.label}</h4>
                <div className="vital-values">
                  <span className={`vital-value-large ${getStatusColor(status.status)}`}>
                    {formatValue(value, config)}
                  </span>
                  {isPaired && (
                    <span className="vital-value-large text-text-primary">
                      {formatValue(vitals[config.pair], vitalConfig.find(c => c.key === config.pair))}
                    </span>
                  )}
                </div>
                <div className="vital-unit">{config.unit}</div>
                {showStatus && (
                  <Badge variant={getStatusVariant(status.status)} size="sm" className="vital-badge">
                    {status.label}
                  </Badge>
                )}
              </Card.Body>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

const VitalTrend = ({ 
  vitalHistory = [],
  vitalKey,
  label,
  unit,
  color = 'primary',
  height = 100,
  className = ''
}) => {
  if (!vitalHistory.length) return null;

  const values = vitalHistory.map(v => v[vitalKey]).filter(v => v !== undefined && v !== null);
  if (!values.length) return null;

  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;

  const points = values.map((value, index) => {
    const x = (index / (values.length - 1)) * 100;
    const y = 100 - ((value - min) / range) * 100;
    return `${x}%,${y}%`;
  }).join(' ');

  const latestValue = values[values.length - 1];
  const firstValue = values[0];
  const trend = latestValue - firstValue;
  const trendDirection = trend > 0 ? '↑' : trend < 0 ? '↓' : '→';

  const colorMap = {
    primary: 'stroke-primary',
    success: 'stroke-success',
    warning: 'stroke-warning',
    error: 'stroke-error',
    secondary: 'stroke-secondary',
    info: 'stroke-primary',
  };

  return (
    <div className={`vital-trend ${className}`} style={{ height: `${height}px` }}>
      <svg className="vital-trend-svg" viewBox="0 0 100 100" preserveAspectRatio="none">
        <defs>
          <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="currentColor" stopOpacity="0" />
            <stop offset="100%" stopColor="currentColor" stopOpacity="0.3" />
          </linearGradient>
        </defs>
        <path
          d={`M${points} L100,100 L0,100 Z`}
          fill="url(#gradient)"
          className={colorMap[color]}
        />
        <path
          d={`M${points}`}
          stroke="currentColor"
          strokeWidth="2"
          fill="none"
          className={colorMap[color]}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      <div className="vital-trend-info">
        <span className="vital-trend-label">{label}</span>
        <span className={`vital-trend-value ${trend > 0 ? 'text-success' : trend < 0 ? 'text-error' : 'text-text-secondary'}`}>
          {latestValue.toFixed(1)} {unit} <span className="vital-trend-direction">{trendDirection}</span>
        </span>
      </div>
    </div>
  );
};

const PatientVitalsSummary = ({ 
  patient,
  vitals,
  vitalHistory = {},
  showTrends = true,
  className = ''
}) => {
  return (
    <div className={className}>
      <Card>
        <Card.Header>
          <Card.Title 
            subtitle={`${patient?.age} yrs • ${patient?.gender} • MRN: ${patient?.mrn}`}
          >
            {patient?.name}
          </Card.Title>
          <div className="flex items-center gap-2">
            <Badge 
              variant={
                patient?.status === 'emergency' ? 'error' :
                patient?.status === 'icu' ? 'warning' :
                patient?.status === 'inpatient' ? 'primary' : 'success'
              }
              size="sm"
              dot
            >
              {patient?.status}
            </Badge>
          </div>
        </Card.Header>
        <Card.Body>
          <VitalsDisplay 
            vitals={vitals} 
            patientId={patient?.id}
            showStatus={true}
          />
          
          {showTrends && Object.keys(vitalHistory).length > 0 && (
            <div className="vital-trends mt-6">
              <h4 className="font-medium text-text-primary mb-3">Trends (Last 24h)</h4>
              <div className="vital-trends-grid">
                {Object.entries(vitalHistory).map(([key, history]) => {
                  const config = {
                    heartRate: { label: 'Heart Rate', unit: 'bpm', color: 'error' },
                    spo2: { label: 'SpO₂', unit: '%', color: 'success' },
                    temperature: { label: 'Temperature', unit: '°F', color: 'warning' },
                    systolic: { label: 'Systolic BP', unit: 'mmHg', color: 'primary' },
                    respiratoryRate: { label: 'Resp. Rate', unit: 'rpm', color: 'info' },
                    bloodGlucose: { label: 'Glucose', unit: 'mg/dL', color: 'warning' },
                  }[key];
                  
                  if (!config || !history.length) return null;
                  
                  return (
                    <VitalTrend
                      key={key}
                      vitalHistory={history}
                      vitalKey={key}
                      label={config.label}
                      unit={config.unit}
                      color={config.color}
                      height={80}
                    />
                  );
                })}
              </div>
            </div>
          )}
        </Card.Body>
      </Card>
    </div>
  );
};

export { VitalsDisplay, VitalTrend, PatientVitalsSummary };
export default VitalsDisplay;