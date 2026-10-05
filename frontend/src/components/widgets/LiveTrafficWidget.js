import React, { useState, useEffect } from 'react';
import trafficService from '../../services/trafficService';

const DEMO_CAMERAS = [
  { id: 1, name: 'NH 66 - Ullal Junction', status: 'Live' },
  { id: 2, name: 'City Center - MG Road', status: 'Live' },
  { id: 3, name: 'Port Road - Fisheries Jetty', status: 'Live' },
  { id: 4, name: 'Airport Road - Cargo Terminal', status: 'Live' }
];

const LiveTrafficWidget = () => {
  const [cameras, setCameras] = useState([]);
  const [trafficStatus, setTrafficStatus] = useState('Moderate');
  const [lastUpdated, setLastUpdated] = useState('2 min ago');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchTraffic = async () => {
      try {
        setLoading(true);
        const [camerasRes, densityRes] = await Promise.all([
          trafficService.getTrafficCameras(),
          trafficService.getTrafficDensity()
        ]);
        const cameraList = Array.isArray(camerasRes) ? camerasRes : (camerasRes.data || camerasRes.cameras || []);
        setCameras(cameraList.length ? cameraList : DEMO_CAMERAS);

        const densityList = Array.isArray(densityRes) ? densityRes : (densityRes.data || densityRes.density || []);
        if (densityList.length > 0) {
          const avg = Math.round(densityList.reduce((s, d) => s + (d.density || 0), 0) / densityList.length);
          setTrafficStatus(avg >= 60 ? 'Heavy' : avg >= 40 ? 'Moderate' : 'Light');
        }
        setLastUpdated('Just now');
        setError(null);
      } catch (err) {
        console.error('Failed to fetch live traffic:', err);
        setError('Unable to load live traffic');
        setCameras(DEMO_CAMERAS);
      } finally {
        setLoading(false);
      }
    };

    fetchTraffic();
  }, []);

  return (
    <div className="bg-surface rounded-xl shadow-md p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-text-lg font-semibold text-text-primary">Live Traffic Feed</h2>
        <div className="flex items-center gap-3">
          <button className="btn-outline btn-sm p-2">
            Refresh Feed
          </button>
          <button className="btn-primary btn-sm p-2">
            Full Screen
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-6">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      ) : error && cameras.length === 0 ? (
        <p className="text-text-secondary text-center py-4">{error}</p>
      ) : (
        <div className="space-y-4">
          <div className="mb-4">
            <h3 className="font-medium text-text-primary mb-2">Camera Feeds</h3>
            <div className="grid gap-3 md:grid-cols-2">
              {cameras.map((camera, idx) => (
                <div key={camera._id || camera.id || idx} className="bg-surface rounded-lg p-3 border border-border/50">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-text-primary">{camera.name || camera.location || `Camera ${idx + 1}`}</span>
                    <span className="text-text-xs text-text-secondary">{camera.status || 'Live'}</span>
                  </div>
                  <div className="h-48 bg-border/20 rounded-lg flex items-center justify-center text-text-secondary">
                    Traffic Camera Feed #{idx + 1}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium text-text-primary mb-1">Traffic Status</h3>
              <p className="text-text-sm text-text-secondary">
                Overall city traffic flow: {trafficStatus}
              </p>
            </div>
            <div className="text-right">
              <div className="flex items-center gap-2">
                <span className="text-text-sm text-text-secondary">Last Updated:</span>
                <span className="font-medium text-text-primary">{lastUpdated}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LiveTrafficWidget;