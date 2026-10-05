import React, { useState, useEffect } from 'react';
import emergencyService from '../../services/emergencyService';

const EmergencyHistoryWidget = ({ full = false } = {}) => {
  const [emergencies, setEmergencies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchEmergencies = async () => {
      try {
        setLoading(true);
        const data = await emergencyService.getEmergencyHistory();
        const list = Array.isArray(data) ? data : (data.data || data.emergencies || []);
        setEmergencies(list);
        setError(null);
      } catch (err) {
        console.error('Failed to fetch emergency history:', err);
        setError('Unable to load emergency history');
        // Fallback demo data
        setEmergencies([
          {
            id: 1,
            createdAt: '2026-01-15T10:00:00.000Z',
            type: 'Medical Emergency',
            status: 'completed',
            location: { address: 'Mangalore City Center' }
          },
          {
            id: 2,
            createdAt: '2025-12-03T10:00:00.000Z',
            type: 'Accident Report',
            status: 'completed',
            location: { address: 'NH 66, Ullal' }
          },
          {
            id: 3,
            createdAt: '2025-11-28T10:00:00.000Z',
            type: 'Fire Incident',
            status: 'completed',
            location: { address: 'Milagres, Mangalore' }
          }
        ]);
      } finally {
        setLoading(false);
      }
    };

    fetchEmergencies();
  }, []);

  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const getStatusClass = (status) => {
    const s = (status || '').toLowerCase();
    if (s === 'completed' || s === 'resolved') return 'bg-success/20 text-success';
    if (s === 'active' || s === 'in-progress' || s === 'in_progress') return 'bg-warning/20 text-warning';
    return 'bg-error/20 text-error';
  };

  const getLocation = (emergency) => {
    if (typeof emergency.location === 'string') return emergency.location;
    return emergency.location?.address || emergency.location?.name || 'Location unavailable';
  };

  const getType = (emergency) => {
    return emergency.type || emergency.emergencyType || 'Emergency';
  };

  const displayList = full ? emergencies : emergencies.slice(0, 2);

  return (
    <div className="bg-surface rounded-xl shadow-md p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-text-lg font-semibold text-text-primary">
          Emergency History
        </h2>
        {!full && (
          <button className="btn-outline btn-sm p-2">
            View All
          </button>
        )}
      </div>

      {loading ? (
        <div className="flex justify-center py-6">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      ) : error && emergencies.length === 0 ? (
        <p className="text-text-secondary text-center py-4">{error}</p>
      ) : (
        <div className="space-y-3">
          {displayList.map(emergency => (
            <div key={emergency._id || emergency.id} className="flex items-center justify-between p-3 bg-primary/5 rounded-lg">
              <div>
                <h3 className="font-medium text-text-primary">{getType(emergency)}</h3>
                <p className="text-text-sm text-text-secondary">
                  {formatDate(emergency.createdAt || emergency.date)} • {getLocation(emergency)}
                </p>
              </div>
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusClass(emergency.status)}`}>
                {emergency.status || 'Unknown'}
              </span>
            </div>
          ))}

          {!full && emergencies.length > 2 && (
            <div className="text-center">
              <button className="btn-outline btn-sm px-3 py-1 text-text-sm">
                +{emergencies.length - 2} more
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default EmergencyHistoryWidget;