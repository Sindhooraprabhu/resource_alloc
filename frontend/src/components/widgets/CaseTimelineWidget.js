import React, { useState, useEffect } from 'react';
import emergencyService from '../../services/emergencyService';

const DEMO_TIMELINE = [
  {
    time: '10:03 AM',
    event: 'Emergency Call Received',
    description: 'Citizen reported chest pain and difficulty breathing',
    location: 'City Mall, Mangalore',
    icon: 'phone',
    status: 'completed'
  },
  {
    time: '10:05 AM',
    event: 'Ambulance Dispatched',
    description: 'Ambulance MH-01 assigned to emergency',
    location: 'Ambulance Station, Mangalore',
    icon: 'ambulance',
    status: 'completed'
  },
  {
    time: '10:12 AM',
    event: 'En Route to Hospital',
    description: 'Patient stabilized, transporting to KMC Attavar',
    location: 'En Route',
    icon: 'truck',
    status: 'active'
  }
];

const CaseTimelineWidget = () => {
  const [timeline, setTimeline] = useState([]);
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
            event: item.event || item.type || 'Timeline Event',
            description: item.description || item.details || '',
            location: item.location?.address || item.location || '',
            icon: item.icon || 'pin',
            status: idx === list.length - 1 ? 'active' : (item.status === 'pending' ? 'pending' : 'completed')
          }));
          setTimeline(mapped);
        } else {
          setTimeline(DEMO_TIMELINE);
        }
        setError(null);
      } catch (err) {
        console.error('Failed to fetch case timeline:', err);
        setError('Unable to load case timeline');
        setTimeline(DEMO_TIMELINE);
      } finally {
        setLoading(false);
      }
    };

    fetchTimeline();
  }, []);

  return (
    <div className="bg-surface rounded-xl shadow-md p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-text-lg font-semibold text-text-primary">Case Timeline</h2>
        <button className="btn-outline btn-sm p-2">
          Export Timeline
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-6">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      ) : error && timeline.length === 0 ? (
        <p className="text-text-secondary text-center py-4">{error}</p>
      ) : (
        <div className="space-y-4">
          {timeline.map((item, index) => (
            <div key={item.id || index} className="flex items-start gap-4 mb-5 last:mb-0">
              <div className="flex-shrink-0">
                <div className="w-10 h-10 flex items-center justify-center rounded-full 
                ${item.status === 'completed' ? 'bg-success/20 text-success' :
                  item.status === 'active' ? 'bg-warning/20 text-warning' :
                  'bg-secondary/20 text-secondary'}">
                  {/* Icons would be rendered here */}
                  <span className="text-[{item.status === 'completed' ? 'text-success' : item.status === 'active' ? 'text-warning' : 'text-secondary'}]">
                    {item.icon.charAt(0).toUpperCase()}
                  </span>
                </div>
              </div>
              <div className="flex-1">
                <div className="flex justify-between mb-1">
                  <h3 className="font-medium text-text-primary">{item.event}</h3>
                  <span className="text-text-xs text-text-secondary">{item.time}</span>
                </div>
                <p className="text-text-sm text-text-secondary">{item.description}</p>
                {item.location && (
                  <p className="text-text-xs text-text-secondary mt-1">
                    <span className="font-medium">Location:</span> {item.location}
                  </p>
                )}
                {!item.location && (
                  <p className="text-text-xs text-text-secondary mt-1">
                    <span className="font-medium">Status:</span> {item.event}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default CaseTimelineWidget;