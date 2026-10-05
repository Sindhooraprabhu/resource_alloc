import React, { useState, useEffect } from 'react';

const LiveVitalsWidget = () => {
  const [vitals, setVitals] = useState({
    heartRate: 85,
    spo2: 98,
    temperature: 98.6,
    systolic: 120,
    diastolic: 80,
    respiratoryRate: 16,
    ecg: Array(200).fill(0).map((_, i) => Math.sin(i * 0.05) * 5 + 50)
  });
  
  useEffect(() => {
    // Simulate real-time vitals updates from monitoring equipment
    const interval = setInterval(() => {
      setVitals(prev => ({
        heartRate: Math.max(40, Math.min(120, prev.heartRate + (Math.random() - 0.5) * 4)),
        spo2: Math.max(85, Math.min(100, prev.spo2 + (Math.random() - 0.5) * 1.5)),
        temperature: Math.max(95, Math.min(105, prev.temperature + (Math.random() - 0.5) * 0.3)),
        systolic: Math.max(90, Math.min(180, prev.systolic + (Math.random() - 0.5) * 4)),
        diastolic: Math.max(60, Math.min(110, prev.diastolic + (Math.random() - 0.5) * 2.5)),
        respiratoryRate: Math.max(8, Math.min(30, prev.respiratoryRate + (Math.random() - 0.5) * 2)),
        ecg: Array(200).fill(0).map((_, i) => Math.sin((i + Date.now() * 0.002) * 0.05) * 5 + 50)
      }));
    }, 1000);
    
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

  const getBPStatus = (sys, dia) => {
    if (sys >= 140 || dia >= 90) return { text: 'Hypertension', color: 'text-warning' };
    if (sys < 90 || dia < 60) return { text: 'Hypotension', color: 'text-warning' };
    return { text: 'Normal', color: 'text-success' };
  };

  return (
    <div className="bg-surface rounded-xl shadow-md p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-text-lg font-semibold text-text-primary">Live Patient Vitals</h2>
        <div className="flex items-center gap-3">
          <button className="btn-outline btn-sm p-2">
            Freeze Frame
          </button>
          <button className="btn-primary btn-sm p-2">
            Get 12-Lead ECG
          </button>
        </div>
      </div>
      
      <div className="space-y-6">
        {/* Vital Signs Grid */}
        <div className="grid gap-4 md:grid-cols-3">
          <div className="bg-surface rounded-lg p-4 border border-border/50">
            <h3 className="font-medium text-text-primary mb-3">Heart Rate</h3>
            <div className="flex items-center justify-between">
              <div className="text-4xl font-bold">
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
              <div className="text-4xl font-bold">
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
              <div className="text-4xl font-bold">
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
              <div className="text-4xl font-bold">
                {vitals.systolic}/{vitals.diastolic} <span className="text-text-xs">mmHg</span>
              </div>
              <div className={`${getBPStatus(vitals.systolic, vitals.diastolic).color}`}>
                {getBPStatus(vitals.systolic, vitals.diastolic).text}
              </div>
            </div>
          </div>
          
          <div className="bg-surface rounded-lg p-4 border border-border/50">
            <h3 className="font-medium text-text-primary mb-3">Respiratory Rate</h3>
            <div className="flex items-center justify-between">
              <div className="text-4xl font-bold">
                {vitals.respiratoryRate} <span className="text-text-xs">rpm</span>
              </div>
              <div className="text-success">
                Normal
              </div>
            </div>
          </div>
          
          <div className="bg-surface rounded-lg p-4 border border-border/50">
            <h3 className="font-medium text-text-primary mb-3">PERF Index</h3>
            <div className="flex items-center justify-between">
              <div className="text-4xl font-bold">
                8.2 <span className="text-text-xs">kPa</span>
              </div>
              <div className="text-success">
                Adequate
              </div>
            </div>
          </div>
        </div>
        
        {/* ECG Monitor */}
        <div className="bg-surface rounded-lg p-4 border border-border/50">
          <h3 className="font-medium text-text-primary mb-4">ECG Monitor (Lead II)</h3>
          <div className="h-96 relative">
            {/* ECG chart would be rendered here */}
            <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-transparent pointer-events-none">
              {/* ECG grid lines */}
            </div>
            <div className="h-full w-[200%] bg-primary/20 animate-[gradient_2s_linear_infinite] overflow-hidden"></div>
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="text-2xl font-bold text-primary">ECG</div>
            </div>
          </div>
        </div>
      </div>
      
      <div className="mt-4 text-center text-text-sm text-text-secondary">
        <p>Last updated: just now</p>
        <p>Sampling rate: 1000 Hz</p>
        <p>Lead: II (Standard)</p>
      </div>
    </div>
  );
};

export default LiveVitalsWidget;