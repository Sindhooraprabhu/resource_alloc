import React, { useState, useEffect } from 'react';

const PatientVitalsWidget = () => {
  const [vitals, setVitals] = useState({
    heartRate: 85,
    spo2: 98,
    temperature: 98.6,
    systolic: 120,
    diastolic: 80,
    ecg: Array(100).fill(0).map((_, i) => Math.sin(i * 0.1) * 10 + 80)
  });
  
  useEffect(() => {
    // Simulate real-time vitals updates
    const interval = setInterval(() => {
      setVitals(prev => ({
        heartRate: Math.max(40, Math.min(120, prev.heartRate + (Math.random() - 0.5) * 3)),
        spo2: Math.max(85, Math.min(100, prev.spo2 + (Math.random() - 0.5) * 1)),
        temperature: Math.max(95, Math.min(105, prev.temperature + (Math.random() - 0.5) * 0.2)),
        systolic: Math.max(90, Math.min(180, prev.systolic + (Math.random() - 0.5) * 3)),
        diastolic: Math.max(60, Math.min(110, prev.diastolic + (Math.random() - 0.5) * 2)),
        ecg: Array(100).fill(0).map((_, i) => Math.sin((i + Date.now() * 0.001) * 0.1) * 10 + 80)
      }));
    }, 2000);
    
    return () => clearInterval(interval);
  }, []);

  const getHeartRateStatus = (hr) => {
    if (hr < 60) return { text: 'Bradycardia', color: 'text-warning' };
    if (hr > 100) return { text: 'Tachycardia', color: 'text-warning' };
    return { text: 'Normal', color: 'text-success' };
  };

  const getSpO2Status = (spo2) => {
    if (spo2 < 90) return { text: 'Hypoxemia', color: 'text-error' };
    if (spo2 < 95) return { text: 'Low', color: 'text-warning' };
    return { text: 'Normal', color: 'text-success' };
  };

  return (
    <div className="bg-surface rounded-xl shadow-md p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-text-lg font-semibold text-text-primary">Patient Vitals</h2>
        <button className="btn-outline btn-sm p-2">
          Export Data
        </button>
      </div>
      
      <div className="grid gap-6 md:grid-cols-2">
        {/* Vital Signs Cards */}
        <div className="bg-surface rounded-lg p-4 border border-border/50">
          <h3 className="font-medium text-text-primary mb-3">Heart Rate</h3>
          <div className="flex items-center justify-between">
            <div className="text-3xl font-bold">
              {vitals.heartRate} <span className="text-text-xs">bpm</span>
            </div>
            <div className={`${getHeartRateStatus(vitals.heartRate).color}`}>
              {getHeartRateStatus(vitals.heartRate).text}
            </div>
          </div>
        </div>
        
        <div className="bg-surface rounded-lg p-4 border border-border/50">
          <h3 className="font-medium text-text-primary mb-3">Blood Oxygen</h3>
          <div className="flex items-center justify-between">
            <div className="text-3xl font-bold">
              {vitals.spo2} <span className="text-text-xs">%</span>
            </div>
            <div className={`${getSpO2Status(vitals.spo2).color}`}>
              {getSpO2Status(vitals.spo2).text}
            </div>
          </div>
        </div>
        
        <div className="bg-surface rounded-lg p-4 border border-border/50">
          <h3 className="font-medium text-text-primary mb-3">Temperature</h3>
          <div className="flex items-center justify-between">
            <div className="text-3xl font-bold">
              {vitals.temperature.toFixed(1)} <span className="text-text-xs">°F</span>
            </div>
            <div className="text-success">
              Normal
            </div>
          </div>
        </div>
        
        <div className="bg-surface rounded-lg p-4 border border-border/50">
          <h3 className="font-medium text-text-primary mb-3">Blood Pressure</h3>
          <div className="flex items-center justify-between">
            <div className="text-3xl font-bold">
              {vitals.systolic}/{vitals.diastolic} <span className="text-text-xs">mmHg</span>
            </div>
            <div className="text-success">
              Normal
            </div>
          </div>
        </div>
      </div>
      
      {/* ECG Chart */}
      <div className="mt-6">
        <h3 className="font-medium text-text-primary mb-4">ECG Monitor</h3>
        <div className="bg-surface rounded-lg p-4 h-96">
          {/* ECG chart would be rendered here */}
          <div className="flex items-center justify-center h-full text-text-secondary">
            ECG Waveform Display
            <div className="h-4 w-full bg-primary/20 rounded-lg mt-2 overflow-hidden">
              <div className="h-full w-[200%] bg-primary animate-[gradient_2s_linear_infinite]"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PatientVitalsWidget;