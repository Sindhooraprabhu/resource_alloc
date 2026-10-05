import React, { useState, useEffect } from 'react';
import emergencyService from '../../services/emergencyService';

const DEMO_PATIENTS = [
  {
    id: 1,
    name: 'Priya Sharma',
    age: 34,
    gender: 'Female',
    condition: 'STEMI - Cardiac Emergency',
    arrivalTime: '10:15 AM',
    priority: 'Critical',
    originatingFacility: 'City Mall, Mangalore',
    transportingAmbulance: 'MH-01',
    estimatedArrival: 'In 3 min'
  },
  {
    id: 2,
    name: 'Rahul Patel',
    age: 45,
    gender: 'Male',
    condition: 'Polytrauma - RTA',
    arrivalTime: '10:08 AM',
    priority: 'Critical',
    originatingFacility: 'NH 66, Ullal',
    transportingAmbulance: 'MH-03',
    estimatedArrival: 'Already arrived'
  }
];

const IncomingPatientsWidget = () => {
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchPatients = async () => {
      try {
        setLoading(true);
        const data = await emergencyService.getActiveEmergencies();
        const list = Array.isArray(data) ? data : (data.data || data.emergencies || []);
        if (list.length > 0) {
          const mapped = list.map((item, idx) => ({
            id: item._id || item.id || idx,
            name: item.patient?.name || item.patientName || 'Unknown Patient',
            age: item.patient?.age || item.age || 'N/A',
            gender: item.patient?.gender || item.gender || 'N/A',
            condition: item.type || item.emergencyType || item.condition || 'Emergency',
            arrivalTime: item.createdAt ? new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'N/A',
            priority: item.severity || item.priority || 'High',
            originatingFacility: item.location?.address || item.location || 'Location unavailable',
            transportingAmbulance: item.ambulance?.vehicleNumber || item.ambulanceId || 'Unassigned',
            estimatedArrival: 'Incoming'
          }));
          setPatients(mapped);
        } else {
          setPatients(DEMO_PATIENTS);
        }
        setError(null);
      } catch (err) {
        console.error('Failed to fetch incoming patients:', err);
        setError('Unable to load incoming patients');
        setPatients(DEMO_PATIENTS);
      } finally {
        setLoading(false);
      }
    };

    fetchPatients();
  }, []);

  const getPriorityColor = (priority) => {
    const p = (priority || '').toLowerCase();
    if (p === 'critical') return 'bg-error/20 text-error';
    if (p === 'high') return 'bg-warning/20 text-warning';
    if (p === 'medium') return 'bg-secondary/20 text-secondary';
    if (p === 'low') return 'bg-success/20 text-success';
    return 'bg-surface/20 text-text-secondary';
  };

  return (
    <div className="bg-surface rounded-xl shadow-md p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-text-lg font-semibold text-text-primary">Incoming Patients</h2>
        <button className="btn-outline btn-sm p-2">
          Refresh List
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-6">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      ) : error && patients.length === 0 ? (
        <p className="text-text-secondary text-center py-4">{error}</p>
      ) : (
        <div className="space-y-4">
          {patients.map(patient => (
            <div key={patient.id} className="border border-border/50 rounded-lg p-4">
              <div className="flex justify-between items-start mb-3">
                <div className="flex-1">
                  <h3 className="font-medium text-text-primary">{patient.name}</h3>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="text-text-sm text-text-secondary">
                      {patient.age} • {patient.gender}
                    </span>
                    <span className="text-text-sm text-text-secondary">
                      • {patient.condition}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(patient.priority)}`}>
                    {patient.priority}
                  </span>
                  <span className="text-text-xs text-text-secondary ml-2">
                    {patient.estimatedArrival}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 text-text-sm">
                <div>
                  <p className="text-text-secondary">Arrival Time:</p>
                  <p className="font-medium">{patient.arrivalTime}</p>
                </div>
                <div>
                  <p className="text-text-secondary">Originating Facility:</p>
                  <p className="font-medium">{patient.originatingFacility}</p>
                </div>
                <div>
                  <p className="text-text-secondary">Transporting Ambulance:</p>
                  <p className="font-medium">{patient.transportingAmbulance}</p>
                </div>
                <div>
                  <p className="text-text-secondary">Destination:</p>
                  <p className="font-medium">KMC Attavar - Emergency</p>
                </div>
              </div>

              <div className="mt-4 flex justify-end space-x-3">
                <button
                  onClick={() => alert(`Preparing for patient ${patient.name}`)}
                  className="btn-primary px-4 py-2"
                >
                  Prepare for Arrival
                </button>
                <button
                  onClick={() => alert(`Viewing full details for ${patient.name}`)}
                  className="btn-outline px-4 py-2"
                >
                  View Details
                </button>
              </div>
            </div>
          ))}

          <div className="mt-4 text-center text-text-sm text-text-secondary">
            <p>Total Incoming: {patients.length} patients</p>
            <p>Critical: 2 | High: 0 | Medium: 0 | Low: 0</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default IncomingPatientsWidget;