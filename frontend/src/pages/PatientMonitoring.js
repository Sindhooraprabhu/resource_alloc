import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import patientService from '../services/patientService';
import { Button, Card, Badge, LoadingSpinner, Alert, Tabs } from '../components/ui';
import { VitalsDisplay, PatientVitalsSummary } from '../components/data';

const PatientMonitoring = ({ patientId }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [patient, setPatient] = useState(null);
  const [vitals, setVitals] = useState({});
  const [vitalHistory, setVitalHistory] = useState({});
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('vitals');
  const simulationIntervalRef = useRef(null);
  const [isSimulating, setIsSimulating] = useState(false);

  // Fetch patient data on mount
  useEffect(() => {
    const fetchPatientData = async () => {
      try {
        setLoading(true);
        // In a real app, this would come from the API
        // const patientData = await patientService.getPatientById(patientId);
        // const vitalsData = await patientService.getPatientVitals(patientId);
        
        // Mock data for demonstration
        const mockPatient = {
          id: patientId || '1',
          name: 'Priya Sharma',
          age: 34,
          gender: 'Female',
          mrn: 'KMC-2026-001234',
          condition: 'STEMI - Cardiac Emergency',
          admittingDoctor: 'Dr. Anjali Reddy',
          admittedAt: '2026-08-07 10:15 AM',
          location: 'ICU-12, KMC Attavar Hospital',
          status: 'icu'
        };

        const mockVitals = {
          heartRate: 85,
          spo2: 98,
          temperature: 98.6,
          systolic: 120,
          diastolic: 80,
          respiratoryRate: 16,
          bloodGlucose: 95,
          perfusionIndex: 8.2
        };

        const mockHistory = {
          heartRate: Array.from({ length: 50 }, (_, i) => ({ heartRate: 80 + Math.sin(i * 0.2) * 10 + Math.random() * 5 })),
          spo2: Array.from({ length: 50 }, (_, i) => ({ spo2: 97 + Math.sin(i * 0.1) * 2 + Math.random() })),
          temperature: Array.from({ length: 50 }, (_, i) => ({ temperature: 98.6 + Math.sin(i * 0.05) * 0.5 + Math.random() * 0.3 })),
          systolic: Array.from({ length: 50 }, (_, i) => ({ systolic: 120 + Math.sin(i * 0.15) * 10 + Math.random() * 5 })),
          respiratoryRate: Array.from({ length: 50 }, (_, i) => ({ respiratoryRate: 16 + Math.sin(i * 0.1) * 2 + Math.random() * 1 })),
          bloodGlucose: Array.from({ length: 50 }, (_, i) => ({ bloodGlucose: 95 + Math.sin(i * 0.05) * 10 + Math.random() * 5 })),
        };

        const mockAlerts = [
          { id: 1, type: 'warning', message: 'Heart rate elevated - consider beta-blocker adjustment', time: '10:45 AM' },
          { id: 2, type: 'info', message: 'SpO2 stable on 2L nasal cannula', time: '10:30 AM' },
        ];

        setPatient(mockPatient);
        setVitals(mockVitals);
        setVitalHistory(mockHistory);
        setAlerts(mockAlerts);
        setError(null);
      } catch (err) {
        setError(err.message || 'Failed to load patient data');
      } finally {
        setLoading(false);
      }
    };

    if (patientId) {
      fetchPatientData();
    }
  }, [patientId]);

  // Real-time vitals simulation
  const updateVitals = useCallback(() => {
    setVitals(prev => ({
      heartRate: Math.max(40, Math.min(120, prev.heartRate + (Math.random() - 0.5) * 4)),
      spo2: Math.max(85, Math.min(100, prev.spo2 + (Math.random() - 0.5) * 1.5)),
      temperature: Math.max(95, Math.min(105, prev.temperature + (Math.random() - 0.5) * 0.3)),
      systolic: Math.max(90, Math.min(180, prev.systolic + (Math.random() - 0.5) * 4)),
      diastolic: Math.max(60, Math.min(110, prev.diastolic + (Math.random() - 0.5) * 2.5)),
      respiratoryRate: Math.max(8, Math.min(30, prev.respiratoryRate + (Math.random() - 0.5) * 2)),
      bloodGlucose: Math.max(70, Math.min(180, prev.bloodGlucose + (Math.random() - 0.5) * 5)),
      perfusionIndex: Math.max(5, Math.min(15, prev.perfusionIndex + (Math.random() - 0.5) * 1))
    }));

    // Update history
    setVitalHistory(prev => {
      const newHistory = { ...prev };
      Object.keys(newHistory).forEach(key => {
        if (newHistory[key].length >= 50) {
          newHistory[key].shift();
        }
        const newValue = {};
        newValue[key] = newHistory[key][newHistory[key].length - 1]?.[key] || 0;
        // This is simplified - in reality you'd compute the new value properly
      });
      return prev; // Keep existing history for demo
    });

    // Generate random alerts occasionally
    if (Math.random() > 0.95) {
      const alertTypes = [
        { type: 'warning', message: 'Heart rate variability increased' },
        { type: 'info', message: 'SpO2 showing slight improvement' },
        { type: 'error', message: 'Blood pressure dropping - notify physician' },
        { type: 'info', message: 'Glucose levels stable' }
      ];
      const randomAlert = alertTypes[Math.floor(Math.random() * alertTypes.length)];
      setAlerts(prev => [
        {
          id: Date.now(),
          type: randomAlert.type,
          message: randomAlert.message,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        },
        ...prev.slice(0, 4)
      ]);
    }
  }, []);

  const toggleSimulation = useCallback(() => {
    setIsSimulating(prev => {
      const newValue = !prev;
      if (newValue) {
        simulationIntervalRef.current = setInterval(updateVitals, 1000);
      } else {
        if (simulationIntervalRef.current) {
          clearInterval(simulationIntervalRef.current);
        }
      }
      return newValue;
    });
  }, [updateVitals]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (simulationIntervalRef.current) {
        clearInterval(simulationIntervalRef.current);
      }
    };
  }, []);

  const handleBack = useCallback(() => {
    navigate('/citizen/dashboard');
  }, [navigate]);

  const handleExportData = useCallback(() => {
    alert('Exporting patient data...');
  }, []);

  const handleGet12Lead = useCallback(() => {
    alert('Generating 12-lead ECG report...');
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          <LoadingSpinner.Overlay visible message="Loading patient data..." />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          <Alert variant="error" title="Error" className="max-w-md mx-auto">
            {error}
          </Alert>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <header className="mb-8">
          <div className="flex justify-between items-center mb-4">
            <h1 className="text-2xl font-bold text-text-primary">
              Patient Monitoring: {patient?.name}
            </h1>
            <div className="flex items-center gap-3">
              <Button variant="outline" onClick={handleBack}>
                Back to Dashboard
              </Button>
              <Button variant="primary" onClick={handleExportData}>
                Export Data
              </Button>
              <Button variant="outline" onClick={handleGet12Lead}>
                12-Lead ECG
              </Button>
            </div>
          </div>
          
          <div className="patient-info-bar">
            <div className="patient-info-item">
              <span className="patient-info-label">MRN:</span>
              <span className="patient-info-value">{patient?.mrn}</span>
            </div>
            <div className="patient-info-item">
              <span className="patient-info-label">Age/Gender:</span>
              <span className="patient-info-value">{patient?.age} • {patient?.gender}</span>
            </div>
            <div className="patient-info-item">
              <span className="patient-info-label">Condition:</span>
              <span className="patient-info-value text-warning">{patient?.condition}</span>
            </div>
            <div className="patient-info-item">
              <span className="patient-info-label">Doctor:</span>
              <span className="patient-info-value">{patient?.admittingDoctor}</span>
            </div>
            <div className="patient-info-item">
              <span className="patient-info-label">Location:</span>
              <span className="patient-info-value">{patient?.location}</span>
            </div>
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
        </header>
        
        <Tabs
          tabs={[
            { value: 'vitals', label: 'Vital Signs' },
            { value: 'alerts', label: 'Alerts', badge: alerts.length },
            { value: 'trends', label: 'Trends' },
          ]}
          activeTab={activeTab}
          onChange={setActiveTab}
          variant="line"
          className="mb-6"
        />

        {activeTab === 'vitals' && (
          <PatientVitalsSummary 
            patient={patient}
            vitals={vitals}
            vitalHistory={vitalHistory}
            showTrends={true}
          />
        )}

        {activeTab === 'alerts' && (
          <Card>
            <Card.Header>
              <Card.Title subtitle={`${alerts.length} active alert${alerts.length !== 1 ? 's' : ''}`}>
                Clinical Alerts & Notifications
              </Card.Title>
            </Card.Header>
            <Card.Body>
              <div className="alerts-list">
                {alerts.map(alert => (
                  <div key={alert.id} className={`alert-item alert-${alert.type}`}>
                    <div className="alert-icon">
                      {alert.type === 'warning' && '⚠️'}
                      {alert.type === 'error' && '✕'}
                      {alert.type === 'info' && 'ℹ️'}
                    </div>
                    <div className="alert-content">
                      <p className="alert-message">{alert.message}</p>
                      <p className="alert-time">{alert.time}</p>
                    </div>
                  </div>
                ))}
                {alerts.length === 0 && (
                  <div className="empty-state-inline">
                    <p>No active alerts</p>
                  </div>
                )}
              </div>
            </Card.Body>
          </Card>
        )}

        {activeTab === 'trends' && (
          <Card>
            <Card.Header>
              <Card.Title subtitle="Real-time vital sign trends over the last 24 hours">
                Vital Sign Trends
              </Card.Title>
              <div className="flex items-center gap-2">
                <Button 
                  variant={isSimulating ? 'error' : 'primary'} 
                  onClick={toggleSimulation}
                  size="sm"
                >
                  {isSimulating ? 'Stop Simulation' : 'Start Simulation'}
                </Button>
              </div>
            </Card.Header>
            <Card.Body>
              <VitalsDisplay 
                vitals={vitals} 
                patientId={patient?.id}
                showStatus={true}
              />
              
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
                      <div key={key} className="vital-trend-card">
                        <h5 className="vital-trend-card-title">{config.label}</h5>
                        <div className="vital-trend" style={{ height: '100px' }}>
                          <svg className="vital-trend-svg" viewBox="0 0 100 100" preserveAspectRatio="none">
                            {(() => {
                              const values = history.map(v => v[key]).filter(v => v !== undefined && v !== null);
                              if (!values.length) return null;
                              const min = Math.min(...values);
                              const max = Math.max(...values);
                              const range = max - min || 1;
                              const points = values.map((value, index) => {
                                const x = (index / (values.length - 1)) * 100;
                                const y = 100 - ((value - min) / range) * 100;
                                return `${x}%,${y}%`;
                              }).join(' ');
                              return (
                                <>
                                  <path d={`${points} L100,100 L0,100 Z`} fill={`url(#gradient-${key})`} className={`stroke-${config.color}`} />
                                  <path d={points} stroke="currentColor" strokeWidth="2" fill="none" className={`stroke-${config.color}`} strokeLinecap="round" strokeLinejoin="round" />
                                </>
                              );
                            })()}
                          </svg>
                          <div className="vital-trend-info">
                            <span className="vital-trend-label">{config.label}</span>
                            <span className="vital-trend-value">
                              {history[history.length - 1]?.[key]?.toFixed(1) || 0} {config.unit}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </Card.Body>
          </Card>
        )}
      </div>
    </div>
  );
};

export default PatientMonitoring;