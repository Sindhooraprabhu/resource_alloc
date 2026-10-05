import React, { useEffect, useState } from 'react';
import emergencyService from '../../services/emergencyService';

const AssignedCasesWidget = () => {
  const [cases, setCases] = useState([]);
  const [loading, setLoading] = useState(false);

  const loadCases = async () => {
    setLoading(true);
    try {
      const active = await emergencyService.getActiveEmergencies();
      if (active && active.length > 0) {
        const mapped = active.map(e => ({
          id: e._id,
          patientName: e.patient?.name || 'Unknown',
          age: e.patient?.age || 'N/A',
          emergencyType: e.subtype || e.type || 'medical',
          pickupLocation: e.address || 'Unknown',
          hospital: e.assignedHospital?.name || e.assignedHospital || 'Unassigned',
          status: e.caseStatus || e.status || 'Reported',
          eta: e.eta || (e.travelTime ? `${e.travelTime} min` : 'N/A'),
          distance: e.distance || null
        }));
        setCases(mapped);
      } else {
        // fallback demo
        setCases([
          { id: 1, patientName: 'Priya Sharma', age: 34, emergencyType: 'Cardiac Emergency', pickupLocation: 'City Mall, Mangalore', hospital: 'KMC Attavar', status: 'En Route', eta: '12 min', distance: '3.2 km' },
          { id: 2, patientName: 'Rahul Patel', age: 45, emergencyType: 'Accident Trauma', pickupLocation: 'NH 66, Ullal', hospital: 'AJ Hospital', status: 'At Scene', eta: 'On Scene', distance: '0.8 km' }
        ]);
      }
    } catch (err) {
      console.warn('Failed to load active cases:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCases();
  }, []);

  return (
    <div className="bg-surface rounded-xl shadow-md p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-text-lg font-semibold text-text-primary">Assigned Cases</h2>
        <button className="btn-outline btn-sm p-2">
          View All
        </button>
      </div>

      <div className="space-y-4">
        {loading && cases.length === 0 && <div className="text-text-secondary">Loading assigned cases...</div>}
        {cases.map(caseItem => (
          <div key={caseItem.id} className="border border-border/50 rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex-1">
                <h3 className="font-medium text-text-primary">{caseItem.patientName}</h3>
                <p className="text-text-sm text-text-secondary">
                  {caseItem.age} years • {caseItem.emergencyType}
                </p>
              </div>
              <span className={`px-3 py-1 rounded-full text-xs font-medium ${caseItem.status === 'Completed' ? 'bg-success/20 text-success' :
                caseItem.status === 'En Route' ? 'bg-warning/20 text-warning' :
                  caseItem.status === 'At Scene' ? 'bg-secondary/20 text-secondary' :
                    'bg-error/20 text-error'
                }`}>
                {caseItem.status}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3 text-text-sm">
              <div>
                <p className="text-text-primary font-semibold">Pickup:</p>
                <p className="font-medium">{caseItem.pickupLocation}</p>
              </div>
              <div>
                <p className="text-text-primary font-semibold">Hospital:</p>
                <p className="font-medium">{caseItem.hospital}</p>
              </div>
              <div>
                <p className="text-text-primary font-semibold">ETA:</p>
                <p className="font-medium">{caseItem.eta}</p>
              </div>
              <div>
                <p className="text-text-primary font-semibold">Distance:</p>
                <p className="font-medium">{caseItem.distance || 'N/A'}</p>
              </div>
            </div>

            <div className="mt-4 flex justify-end space-x-3">
              <button
                onClick={() => alert(`Starting case ${caseItem.id}`)}
                className="btn-primary px-4 py-2"
                disabled={caseItem.status === 'At Scene' || caseItem.status === 'En Route'}
              >
                Start Case
              </button>
              <button
                onClick={() => alert(`Completing case ${caseItem.id}`)}
                className="btn-success px-4 py-2"
                disabled={caseItem.status !== 'En Route'}
              >
                Complete Case
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AssignedCasesWidget;