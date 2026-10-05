import React, { useState, useEffect } from 'react';
import hospitalService from '../../services/hospitalService';

const DEMO_HOSPITALS = [
  { id: 1, name: 'KMC Attavar', distance: 0.8, rating: 4.2 },
  { id: 2, name: 'AJ Hospital', distance: 1.2, rating: 4.5 },
  { id: 3, name: 'Father Muller', distance: 1.5, rating: 4.7 }
];

const NearbyHospitalsWidget = () => {
  const [hospitals, setHospitals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchHospitals = async () => {
      try {
        setLoading(true);
        const data = await hospitalService.getHospitals();
        const list = Array.isArray(data) ? data : (data.data || data.hospitals || []);
        setHospitals(list.length ? list : DEMO_HOSPITALS);
        setError(null);
      } catch (err) {
        console.error('Failed to fetch hospitals:', err);
        setError('Unable to load hospitals');
        setHospitals(DEMO_HOSPITALS);
      } finally {
        setLoading(false);
      }
    };

    fetchHospitals();
  }, []);

  const getDistance = (hospital) => {
    if (hospital.distance) return `${hospital.distance} km`;
    if (hospital.location?.distance) return `${hospital.location.distance} km`;
    return 'N/A';
  };

  const getRating = (hospital) => {
    if (hospital.rating) return `${hospital.rating}★ Rating`;
    return 'N/A';
  };

  return (
    <div className="bg-surface rounded-xl shadow-md p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-text-lg font-semibold text-text-primary">Nearby Hospitals</h2>
        <button className="btn-outline btn-sm p-2">
          View All
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-6">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      ) : error && hospitals.length === 0 ? (
        <p className="text-text-secondary text-center py-4">{error}</p>
      ) : (
        <div className="space-y-4">
          <div className="grid gap-3">
            {hospitals.slice(0, 3).map(hospital => (
              <div key={hospital._id || hospital.id} className="flex items-center gap-4 p-3 bg-primary/5 rounded-lg">
                <div className="flex items-center justify-center w-10 h-10 bg-primary/20 rounded-lg">
                  <svg className="h-4 w-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 14l2-2-3-3.5-3 3.5 2 2zm0 0l4-2M5 19l5-5 5 5" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-medium text-text-primary">{hospital.name}</h3>
                  <p className="text-text-sm text-text-secondary">{getDistance(hospital)} • {getRating(hospital)}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="text-center mt-4">
            <button className="btn-primary btn-sm px-4 py-2">
              See All {hospitals.length || 12} Hospitals
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default NearbyHospitalsWidget;
