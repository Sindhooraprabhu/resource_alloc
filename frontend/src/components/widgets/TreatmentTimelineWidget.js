import React, { useState, useEffect } from 'react';
import emergencyService from '../../services/emergencyService';

const DEMO_TIMELINE = [
  {
    time: '10:15 AM',
    event: 'Patient Arrival',
    description: 'Patient arrived via ambulance MH-01 with chest pain and diaphoresis',
    location: 'Emergency Department',
    icon: 'ambulance',
    status: 'completed'
  },
  {
    time: '10:17 AM',
    event: 'Initial Assessment',
    description: 'Primary survey completed. IV access obtained. ECG shows ST elevation in II, III, aVF',
    location: 'Emergency Department',
    icon: 'stethoscope',
    status: 'completed'
  },
  {
    time: '10:25 AM',
    event: 'Transfer to Cath Lab',
    description: 'Patient transferred for emergent percutaneous coronary intervention',
    location: 'In Transit',
    icon: 'truck',
    status: 'active'
  }
];

const TreatmentTimelineWidget = () => {
  const [treatmentTimeline, setTreatmentTimeline] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchTimeline = async () => {
      try {
        setLoading(true);
        const data = await emergencyService.getAllAllocationHistories();
        const list = Array.isArray(data) ? data : (data.data || data.histories || []);
        if (list.length > 0) {
          const mapped = list.map((item, idx) => ({
            id: item._id || idx,
            time: item.createdAt ? new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'N/A',
            event: item.event || item.type || 'Treatment Event',
            description: item.description || item.details || '',
            location: item.location?.address || item.location || '',
            icon: item.icon || 'pin',
            status: idx === list.length - 1 ? 'active' : (item.status === 'pending' ? 'pending' : 'completed')
          }));
          setTreatmentTimeline(mapped);
        } else {
          setTreatmentTimeline(DEMO_TIMELINE);
        }
        setError(null);
      } catch (err) {
        console.error('Failed to fetch treatment timeline:', err);
        setError('Unable to load treatment timeline');
        setTreatmentTimeline(DEMO_TIMELINE);
      } finally {
        setLoading(false);
      }
    };

    fetchTimeline();
  }, []);

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return 'text-success';
      case 'active': return 'text-warning';
      case 'pending': return 'text-secondary';
      default: return 'text-text-secondary';
    }
  };

  return (
    <div className="bg-surface rounded-xl shadow-md p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-text-lg font-semibold text-text-primary">Treatment Timeline</h2>
        <button className="btn-outline btn-sm p-2">
          Export Timeline
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-6">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      ) : error && treatmentTimeline.length === 0 ? (
        <p className="text-text-secondary text-center py-4">{error}</p>
      ) : (
        <>
          <div className="space-y-4">
            {treatmentTimeline.map((item, index) => (
              <div key={item.id || index} className="flex items-start gap-4 mb-5 last:mb-0">
                <div className="flex-shrink-0">
                  <div className={`w-10 h-10 flex items-center justify-center rounded-full ${item.status === 'completed' ? 'bg-success/20 text-success' :
                      item.status === 'active' ? 'bg-warning/20 text-warning' :
                        'bg-secondary/20 text-secondary'
                    }`}>
                    {/* Icons would be rendered here */}
                    <span className={`${getStatusColor(item.status)} font-bold text-xs`}>
                      {item.icon.charAt(0).toUpperCase()}
                    </span>
                  </div>
                </div>
                <div className="flex-1">
                  <div className="flex justify-between mb-1">
                    <h3 className="font-medium text-text-primary">{item.event}</h3>
                    <span className="text-text-xs text-text-secondary">{item.time}</span>
                  </div>
                  <p className="text-text-sm">{item.description}</p>
                  {item.location && (
                    <p className="text-text-xs text-text-secondary mt-1">
                      <span className="font-medium">Location:</span> {item.location}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-4 flex justify-between text-text-sm">
            <span className="text-text-secondary">Total Duration: 45 minutes</span>
            <span className="font-medium text-success">Door-to-Balloon Time: 40 min</span>
          </div>
        </>
      )}
    </div>
  );
};

export default TreatmentTimelineWidget;