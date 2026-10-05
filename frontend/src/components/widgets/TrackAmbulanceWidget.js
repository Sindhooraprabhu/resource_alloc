import React, { useState, useEffect } from 'react';
import ambulanceService from '../../services/ambulanceService';

const TrackAmbulanceWidget = () => {
  const [showMap, setShowMap] = useState(false);
  const [ambulance, setAmbulance] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchAmbulance = async () => {
      try {
        setLoading(true);
        const data = await ambulanceService.getAmbulances();
        const list = Array.isArray(data) ? data : (data.data || data.ambulances || []);
        // Prefer an en-route ambulance, otherwise first one
        const target = list.find(a => (a.status || '').toLowerCase().includes('route'))
          || list.find(a => (a.status || '').toLowerCase().includes('scene'))
          || list[0];
        if (target) {
          setAmbulance(target);
        } else {
          setError('No ambulances currently available');
        }
        setError(null);
      } catch (err) {
        console.error('Failed to fetch ambulance:', err);
        setError('Unable to load ambulance data');
      } finally {
        setLoading(false);
      }
    };

    fetchAmbulance();
  }, []);

  const getName = () => {
    if (!ambulance) return 'Ambulance';
    return ambulance.name || ambulance.vehicleNumber || ambulance._id || 'Ambulance';
  };

  const getStatus = () => {
    if (!ambulance || !ambulance.status) return 'Unknown';
    const s = ambulance.status.toLowerCase();
    if (s === 'en_route' || s === 'en route') return 'En Route';
    if (s === 'at_scene' || s === 'at scene') return 'At Scene';
    return ambulance.status;
  };

  const getLocation = () => {
    if (!ambulance || !ambulance.location) return 'Location unavailable';
    if (typeof ambulance.location === 'string') return ambulance.location;
    return ambulance.location.address || ambulance.location.name || 'Location unavailable';
  };

  const getDistance = () => {
    if (!ambulance) return 'N/A';
    if (ambulance.distance) return `${ambulance.distance} km`;
    if (ambulance.location?.distance) return `${ambulance.location.distance} km`;
    return 'N/A';
  };

  return (
    <div className="bg-surface rounded-xl shadow-md p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-text-lg font-semibold text-text-primary">Track Ambulance</h2>
        <button className="btn-outline btn-sm p-2">
          {showMap ? 'Hide Map' : 'Show Map'}
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-6">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      ) : error && !ambulance ? (
        <p className="text-text-secondary text-center py-4">{error}</p>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center gap-4 p-3 bg-primary/5 rounded-lg">
            <div className="flex items-center justify-center w-10 h-10 bg-primary/20 rounded-lg">
              <svg className="h-4 w-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <h3 className="font-medium text-text-primary">{getName()}</h3>
              <p className="text-text-sm text-text-secondary">
                {getStatus()} • {getLocation()} • Distance: {getDistance()}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowMap(true)}
              className="btn-primary px-4 py-2"
            >
              Track Live Location
            </button>
            <button
              onClick={() => alert('Sharing location with ambulance...')}
              className="btn-outline px-4 py-2"
            >
              Share My Location
            </button>
          </div>
        </div>
      )}

      {showMap && (
        <div className="mt-4">
          <div className="map-container">
            {/* Map would be rendered here */}
            <div className="flex items-center justify-center h-full text-text-secondary">
              Map View - Ambulance Location Tracking
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TrackAmbulanceWidget;