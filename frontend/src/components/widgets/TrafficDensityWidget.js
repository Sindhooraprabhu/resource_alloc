import React, { useState, useEffect } from 'react';
import trafficService from '../../services/trafficService';

const DEMO_DENSITY = [
  { road: 'NH 66', segment: 'Ullal to City Center', density: 75, status: 'Heavy' },
  { road: 'MG Road', segment: 'City Center to Hospital Junction', density: 60, status: 'Moderate' },
  { road: 'Port Road', segment: 'Fisheries Jetty to Port', density: 40, status: 'Light' },
  { road: 'Airport Road', segment: 'City to Airport', density: 30, status: 'Light' },
  { road: 'CarStreet', segment: 'City Center to Old Port', density: 80, status: 'Heavy' },
  { road: 'Balmatta Road', segment: 'City Center to Balmatta', density: 55, status: 'Moderate' }
];

const TrafficDensityWidget = () => {
  const [densityData, setDensityData] = useState([]);
  const [incidentCount, setIncidentCount] = useState(3);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchTraffic = async () => {
      try {
        setLoading(true);
        const [densityRes, incidentsRes] = await Promise.all([
          trafficService.getTrafficDensity(),
          trafficService.getTrafficIncidents()
        ]);
        const densityList = Array.isArray(densityRes) ? densityRes : (densityRes.data || densityRes.density || []);
        const incidentsList = Array.isArray(incidentsRes) ? incidentsRes : (incidentsRes.data || incidentsRes.incidents || []);
        setDensityData(densityList.length ? densityList : DEMO_DENSITY);
        setIncidentCount(incidentsList.length || 3);
        setError(null);
      } catch (err) {
        console.error('Failed to fetch traffic density:', err);
        setError('Unable to load traffic data');
        setDensityData(DEMO_DENSITY);
      } finally {
        setLoading(false);
      }
    };

    fetchTraffic();
  }, []);

  const getDensityColor = (density) => {
    if (density >= 80) return 'bg-error/20 text-error';
    if (density >= 60) return 'bg-warning/20 text-warning';
    if (density >= 40) return 'bg-secondary/20 text-secondary';
    return 'bg-success/20 text-success';
  };

  const getStatus = (density) => {
    if (density >= 80) return 'Severe';
    if (density >= 60) return 'Heavy';
    if (density >= 40) return 'Moderate';
    return 'Light';
  };

  return (
    <div className="bg-surface rounded-xl shadow-md p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-text-lg font-semibold text-text-primary">Traffic Density Analysis</h2>
        <div className="flex items-center gap-3">
          <button className="btn-outline btn-sm p-2">
            Refresh Data
          </button>
          <button className="btn-primary btn-sm p-2">
            View Heatmap
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-6">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      ) : error && densityData.length === 0 ? (
        <p className="text-text-secondary text-center py-4">{error}</p>
      ) : (
        <div className="space-y-4">
          <div className="mb-4">
            <h3 className="font-medium text-text-primary mb-2">Road-wise Traffic Density</h3>
            <div className="space-y-3">
              {densityData.map((road, index) => (
                <div key={index} className="flex justify-between items-center p-3 bg-primary/5 rounded-lg">
                  <div className="flex-1">
                    <div className="flex justify-between mb-1">
                      <h3 className="font-medium text-text-primary">{road.road}</h3>
                      <span className="text-text-xs text-text-secondary">{road.status || getStatus(road.density)}</span>
                    </div>
                    <p className="text-text-sm text-text-secondary">{road.segment}</p>
                  </div>
                  <div className={`w-10 h-10 flex items-center justify-center rounded-full ${getDensityColor(road.density)}`}>
                    <span className="text-text-xs font-medium">{road.density}%</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mb-4">
            <h3 className="font-medium text-text-primary mb-2">City Traffic Overview</h3>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="bg-surface rounded-lg p-4 border border-border/50">
                <h4 className="font-medium text-text-primary mb-2">Congestion Level</h4>
                <p className="text-2xl font-bold text-warning">{densityData.length ? Math.round(densityData.reduce((s, d) => s + (d.density || 0), 0) / densityData.length) : 65}%</p>
                <p className="text-text-sm text-text-secondary">City Average</p>
              </div>

              <div className="bg-surface rounded-lg p-4 border border-border/50">
                <h4 className="font-medium text-text-primary mb-2">Average Speed</h4>
                <p className="text-2xl font-bold text-primary">28 km/h</p>
                <p className="text-text-sm text-text-secondary">City Average</p>
              </div>

              <div className="bg-surface rounded-lg p-4 border border-border/50">
                <h4 className="font-medium text-text-primary mb-2">Incident Count</h4>
                <p className="text-2xl font-bold text-secondary">{incidentCount}</p>
                <p className="text-text-sm text-text-secondary">Active Reports</p>
              </div>
            </div>
          </div>

          <div className="map-container">
            {/* Heatmap would be rendered here */}
            <div className="flex items-center justify-center h-full text-text-secondary">
              Traffic Density Heatmap
              <div className="mt-3 flex items-center gap-3">
                <div className="w-2 h-2 bg-success rounded"></div>
                <span className="text-text-xs">Light (0-40%)</span>
                <div className="w-2 h-2 bg-secondary rounded"></div>
                <span className="text-text-xs">Moderate (40-60%)</span>
                <div className="w-2 h-2 bg-warning rounded"></div>
                <span className="text-text-xs">Heavy (60-80%)</span>
                <div className="w-2 h-2 bg-error rounded"></div>
                <span className="text-text-xs">Severe (80-100%)</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TrafficDensityWidget;