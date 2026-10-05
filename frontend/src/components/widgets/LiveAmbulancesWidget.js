import React, { useState, useEffect } from 'react';
import ambulanceService from '../../services/ambulanceService';

const DEMO_AMBULANCES = [
  {
    id: 'MH-01',
    name: 'Ambulance MH-01',
    status: 'en_route',
    location: { address: 'City Mall, Mangalore' },
    destination: 'KMC Attavar Hospital',
    eta: '8 min',
    speed: '45 km/h',
    patient: 'Priya Sharma, 34F',
    condition: 'Cardiac Emergency'
  },
  {
    id: 'MH-02',
    name: 'Ambulance MH-02',
    status: 'at_scene',
    location: { address: 'NH 66, Ullal' },
    destination: 'AJ Hospital',
    eta: 'On Scene',
    speed: '0 km/h',
    patient: 'Rahul Patel, 45M',
    condition: 'Accident Trauma'
  },
  {
    id: 'MH-03',
    name: 'Ambulance MH-03',
    status: 'available',
    location: { address: 'Ambulance Station, City Center' },
    destination: 'Standby',
    eta: 'N/A',
    speed: '0 km/h',
    patient: 'None',
    condition: 'N/A'
  }
];

const LiveAmbulancesWidget = () => {
  const [ambulances, setAmbulances] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchAmbulances = async () => {
      try {
        setLoading(true);
        const data = await ambulanceService.getAmbulances();
        const list = Array.isArray(data) ? data : (data.data || data.ambulances || []);
        setAmbulances(list.length ? list : DEMO_AMBULANCES);
        setError(null);
      } catch (err) {
        console.error('Failed to fetch ambulances:', err);
        setError('Unable to load ambulances');
        setAmbulances(DEMO_AMBULANCES);
      } finally {
        setLoading(false);
      }
    };

    fetchAmbulances();
  }, []);

  const getStatusColor = (status) => {
    const s = (status || '').toLowerCase();
    if (s === 'en_route' || s === 'en route') return 'bg-warning/20 text-warning';
    if (s === 'at_scene' || s === 'at scene') return 'bg-secondary/20 text-secondary';
    if (s === 'available') return 'bg-success/20 text-success';
    if (s === 'returning') return 'bg-primary/20 text-primary';
    return 'bg-surface/20 text-text-secondary';
  };

  const getStatusLabel = (status) => {
    const s = (status || '').toLowerCase();
    if (s === 'en_route') return 'En Route';
    if (s === 'at_scene') return 'At Scene';
    if (s === 'available') return 'Available';
    if (s === 'returning') return 'Returning';
    return status || 'Unknown';
  };

  const getLocation = (ambulance) => {
    if (typeof ambulance.location === 'string') return ambulance.location;
    return ambulance.location?.address || ambulance.location?.name || 'Location unavailable';
  };

  const getPatient = (ambulance) => {
    if (ambulance.patient) return ambulance.patient;
    if (ambulance.currentPatient?.name) {
      return `${ambulance.currentPatient.name}, ${ambulance.currentPatient.age || ''}${ambulance.currentPatient.gender || ''}`;
    }
    return 'None';
  };

  const getCondition = (ambulance) => {
    if (ambulance.condition) return ambulance.condition;
    if (ambulance.currentEmergency?.type) return ambulance.currentEmergency.type;
    return 'N/A';
  };

  return (
    <div className="bg-surface rounded-xl shadow-md p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-text-lg font-semibold text-text-primary">Live Ambulance Tracking</h2>
        <div className="flex items-center gap-3">
          <button className="btn-outline btn-sm p-2">
            Refresh Locations
          </button>
          <button className="btn-primary btn-sm p-2">
            Full Screen Map
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-6">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      ) : error && ambulances.length === 0 ? (
        <p className="text-text-secondary text-center py-4">{error}</p>
      ) : (
        <div className="space-y-4">
          <div className="mb-4">
            <h3 className="font-medium text-text-primary mb-2">Ambulance Fleet Status</h3>
            <div className="space-y-3">
              {ambulances.map(ambulance => (
                <div key={ambulance._id || ambulance.id} className="flex items-center justify-between p-3 bg-primary/5 rounded-lg">
                  <div className="flex-1">
                    <div className="flex justify-between mb-1">
                      <h3 className="font-medium text-text-primary">{ambulance.name || ambulance.vehicleNumber || ambulance._id || 'Ambulance'}</h3>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(ambulance.status)}`}>
                        {getStatusLabel(ambulance.status)}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-text-sm">
                      <span className="text-text-secondary">{getLocation(ambulance)}</span>
                      {ambulance.speed && (
                        <>
                          <span className="text-text-xs">•</span>
                          <span className="font-medium">{ambulance.speed}</span>
                        </>
                      )}
                    </div>
                    <p className="text-text-sm text-text-secondary mt-1">
                      {getPatient(ambulance)} • {getCondition(ambulance)}
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center gap-2">
                      <span className="text-text-sm text-text-secondary">ETA:</span>
                      <span className="font-medium">{ambulance.eta || 'N/A'}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="map-container">
            {/* Map would be rendered here */}
            <div className="flex items-center justify-center h-full text-text-secondary">
              Live Ambulance Tracking Map
              <div className="mt-3 flex items-center gap-3">
                <div className="w-2 h-2 bg-primary rounded"></div>
                <span className="text-text-xs">En Route</span>
                <div className="w-2 h-2 bg-secondary rounded"></div>
                <span className="text-text-xs">At Scene</span>
                <div className="w-2 h-2 bg-success rounded"></div>
                <span className="text-text-xs">Available</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LiveAmbulancesWidget;