import React, { useState, useEffect } from 'react';
import trafficService from '../../services/trafficService';

const DEMO_CORRIDORS = [
  {
    id: 1,
    ambulance: 'MH-01',
    route: 'City Mall → KMC Attavar',
    startTime: '10:12 AM',
    duration: '8 min',
    status: 'Active',
    intersections: 5,
    signalsCleared: 3
  },
  {
    id: 2,
    ambulance: 'MH-04',
    route: 'Port Road → Father Muller',
    startTime: '10:15 AM',
    duration: '12 min',
    status: 'Active',
    intersections: 8,
    signalsCleared: 5
  }
];

const DEMO_PENDING = [
  {
    id: 1,
    ambulance: 'MH-02',
    route: 'NH 66 → AJ Hospital',
    eta: '3 min',
    priority: 'Critical',
    reason: 'Accident Trauma - ETA critical'
  }
];

const GreenCorridorWidget = () => {
  const [activeCorridors, setActiveCorridors] = useState([]);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchCorridors = async () => {
      try {
        setLoading(true);
        const data = await trafficService.getActiveGreenCorridors();
        const list = Array.isArray(data) ? data : (data.data || data.corridors || []);
        setActiveCorridors(list.length ? list : DEMO_CORRIDORS);
        setPendingRequests(DEMO_PENDING);
        setError(null);
      } catch (err) {
        console.error('Failed to fetch green corridors:', err);
        setError('Unable to load green corridors');
        setActiveCorridors(DEMO_CORRIDORS);
        setPendingRequests(DEMO_PENDING);
      } finally {
        setLoading(false);
      }
    };

    fetchCorridors();
  }, []);

  return (
    <div className="bg-surface rounded-xl shadow-md p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-text-lg font-semibold text-text-primary">Green Corridor Management</h2>
        <div className="flex items-center gap-3">
          <button className="btn-outline btn-sm p-2">
            Refresh Status
          </button>
          <button className="btn-primary btn-sm p-2">
            Request Corridor
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-6">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      ) : error && activeCorridors.length === 0 ? (
        <p className="text-text-secondary text-center py-4">{error}</p>
      ) : (
        <div className="space-y-6">
          {/* Active Corridors */}
          <div className="mb-4">
            <h3 className="font-medium text-text-primary mb-2">Active Green Corridors</h3>
            {activeCorridors.length > 0 ? (
              <div className="space-y-3">
                {activeCorridors.map(corridor => (
                  <div key={corridor.id} className="border border-border/50 rounded-lg p-4">
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex-1">
                        <h3 className="font-medium text-text-primary">{corridor.ambulance}</h3>
                        <p className="text-text-sm text-text-secondary">
                          {corridor.route}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium bg-warning/20 text-warning`}>
                          {corridor.status}
                        </span>
                        <span className="text-text-xs text-text-secondary ml-2">
                          {corridor.duration}
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 text-text-sm">
                      <div>
                        <p className="text-text-secondary">Start Time:</p>
                        <p className="font-medium">{corridor.startTime}</p>
                      </div>
                      <div>
                        <p className="text-text-secondary">Duration:</p>
                        <p className="font-medium">{corridor.duration}</p>
                      </div>
                      <div>
                        <p className="text-text-secondary">Intersections:</p>
                        <p className="font-medium">{corridor.intersections}</p>
                      </div>
                      <div>
                        <p className="text-text-secondary">Signals Cleared:</p>
                        <p className="font-medium">{corridor.signalsCleared}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-text-secondary">
                <p>No active green corridors</p>
              </div>
            )}
          </div>

          {/* Pending Requests */}
          <div className="mb-4">
            <h3 className="font-medium text-text-primary mb-2">Pending Corridor Requests</h3>
            {pendingRequests.length > 0 ? (
              <div className="space-y-3">
                {pendingRequests.map(request => (
                  <div key={request.id} className="border border-border/50 rounded-lg p-4">
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex-1">
                        <h3 className="font-medium text-text-primary">{request.ambulance}</h3>
                        <p className="text-text-sm text-text-secondary">
                          {request.route}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${request.priority.toLowerCase() === 'critical' ? 'bg-error/20 text-error' : request.priority.toLowerCase() === 'high' ? 'bg-warning/20 text-warning' : 'bg-secondary/20 text-secondary'}`}>
                          {request.priority}
                        </span>
                        <span className="text-text-xs text-text-secondary ml-2">
                          ETA: {request.eta}
                        </span>
                      </div>
                    </div>

                    <div className="mt-3">
                      <p className="text-text-sm text-text-secondary font-medium">Reason:</p>
                      <p className="text-text-sm">{request.reason}</p>
                    </div>

                    <div className="mt-4 flex justify-end">
                      <button
                        onClick={() => alert(`Approving green corridor for ${request.ambulance}`)}
                        className="btn-success px-4 py-2"
                      >
                        Approve
                      </button>
                      <button
                        onClick={() => alert(`Rejecting green corridor for ${request.ambulance}`)}
                        className="btn-error px-4 py-2"
                      >
                        Reject
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-text-secondary">
                <p>No pending corridor requests</p>
              </div>
            )}
          </div>

          {/* Statistics */}
          <div className="bg-surface rounded-lg p-4 border border-border/50">
            <h3 className="font-medium text-text-primary mb-3">Green Corridor Statistics</h3>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="text-center">
                <p className="text-text-sm text-text-secondary">Today</p>
                <p className="text-2xl font-bold text-primary">5</p>
                <p className="text-text-sm">Corridors Activated</p>
              </div>
              <div className="text-center">
                <p className="text-text-sm text-text-secondary">Average Time Saved</p>
                <p className="text-2xl font-bold text-success">4.2 min</p>
                <p className="text-text-sm">Per Emergency</p>
              </div>
              <div className="text-center">
                <p className="text-text-sm text-text-secondary">Success Rate</p>
                <p className="text-2xl font-bold text-warning">87%</p>
                <p className="text-text-sm">Request Approval</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GreenCorridorWidget;