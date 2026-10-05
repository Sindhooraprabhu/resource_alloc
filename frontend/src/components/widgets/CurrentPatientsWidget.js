import React, { useEffect, useState } from 'react';
import patientService from '../../services/patientService';

const CurrentPatientsWidget = () => {
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(false);

  const loadPatients = async () => {
    setLoading(true);
    try {
      const data = await patientService.getCurrentPatients();
      if (data && data.length > 0) setPatients(data);
      else setPatients([]);
    } catch (err) {
      console.warn('Failed to load patients:', err);
      setPatients([
        { id: 1, name: 'Priya Sharma', age: 34, condition: 'Post-Cardiac Intervention', bed: 'ICU-12', doctor: 'Dr. Anjali Reddy', timeAdmitted: '2 hours ago', status: 'Stable' },
        { id: 2, name: 'Rahul Patel', age: 45, condition: 'Trauma Surgery Recovery', bed: 'ICU-08', doctor: 'Dr. Vikram Singh', timeAdmitted: '5 hours ago', status: 'Critical' }
      ]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadPatients(); }, []);
  const getStatusColor = (status) => {
    switch (status.toLowerCase()) {
      case 'critical': return 'text-error';
      case 'serious': return 'text-warning';
      case 'stable': return 'text-success';
      default: return 'text-text-secondary';
    }
  };

  return (
    <div className="bg-surface rounded-xl shadow-md p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-text-lg font-semibold text-text-primary">Current Patients</h2>
        <div className="flex items-center gap-3">
          <button className="btn-outline btn-sm p-2">
            Admit New Patient
          </button>
          <button className="btn-primary btn-sm p-2">
            Discharge Patient
          </button>
        </div>
      </div>

      <div className="space-y-3">
        {loading && patients.length === 0 && <div className="text-text-secondary">Loading current patients...</div>}
        {patients.map(patient => (
          <div key={patient.id || patient._id} className="border border-border/50 rounded-lg p-4">
            <div className="flex justify-between items-start mb-2">
              <div className="flex-1">
                <h3 className="font-medium text-text-primary">{patient.name}</h3>
                <p className="text-text-sm text-text-secondary">
                  {patient.age || 'N/A'} years • {patient.condition || 'N/A'}
                </p>
              </div>
              <span className={`text-text-xs font-medium ${getStatusColor(patient.status || '')}`}>
                {patient.status || 'Unknown'}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3 text-text-sm">
              <div>
                <p className="text-text-primary font-semibold">Bed:</p>
                <p className="font-medium">{patient.bed || '—'}</p>
              </div>
              <div>
                <p className="text-text-primary font-semibold">Doctor:</p>
                <p className="font-medium">{patient.doctor || '—'}</p>
              </div>
              <div>
                <p className="text-text-primary font-semibold">Admitted:</p>
                <p className="font-medium">{patient.timeAdmitted || '—'}</p>
              </div>
              <div>
                <p className="text-text-primary font-semibold">Condition:</p>
                <p className="font-medium">{patient.condition || '—'}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-4 text-center text-text-sm text-text-secondary">
        <p>Total Patients: {patients.length}</p>
        <p>ICU Occupancy: {patients.filter(p => p.bed && p.bed.toLowerCase().includes('icu')).length}/20 beds</p>
        <p>General Ward: {patients.length - patients.filter(p => p.bed && p.bed.toLowerCase().includes('icu')).length}/150 beds</p>
      </div>
    </div>
  );
};

export default CurrentPatientsWidget;