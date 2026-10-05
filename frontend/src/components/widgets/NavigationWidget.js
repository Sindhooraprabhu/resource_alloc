import React, { useState, useEffect } from 'react';
import trafficService from '../../services/trafficService';

const NavigationWidget = () => {
  const [route, setRoute] = useState(null);
  const [trafficCondition, setTrafficCondition] = useState('Light');
  const [greenCorridor, setGreenCorridor] = useState('Active');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchRoute = async () => {
      try {
        setLoading(true);
        const [routeRes, densityRes] = await Promise.all([
          trafficService.getRouteOptimization({
            origin: 'City Mall, Mangalore',
            destination: 'KMC Attavar Hospital'
          }),
          trafficService.getTrafficDensity()
        ]);

        const routeData = routeRes?.data || routeRes?.route || routeRes;
        if (routeData) {
          setRoute(routeData);
        }

        const densityList = Array.isArray(densityRes) ? densityRes : (densityRes.data || densityRes.density || []);
        if (densityList.length > 0) {
          const avg = Math.round(densityList.reduce((s, d) => s + (d.density || 0), 0) / densityList.length);
          setTrafficCondition(avg >= 60 ? 'Heavy' : avg >= 40 ? 'Moderate' : 'Light');
        }
        setError(null);
      } catch (err) {
        console.error('Failed to fetch navigation route:', err);
        setError('Unable to load route data');
      } finally {
        setLoading(false);
      }
    };

    fetchRoute();
  }, []);

  const getEta = () => {
    if (route?.eta) return route.eta;
    if (route?.duration) return route.duration;
    return '12 min';
  };

  const getDistance = () => {
    if (route?.distance) return `${route.distance} km`;
    return '3.2 km';
  };

  return (
    <div className="bg-surface rounded-xl shadow-md p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-text-lg font-semibold text-text-primary">Navigation & Route</h2>
        <button className="btn-outline btn-sm p-2">
          Refresh Route
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-6">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      ) : error ? (
        <p className="text-text-secondary text-center py-4">{error}</p>
      ) : (
        <div className="space-y-4">
          <div className="mb-4">
            <h3 className="font-medium text-text-primary mb-2">Current Route</h3>
            <div className="bg-surface rounded-lg p-3 border border-border/50">
              <p className="text-text-sm text-text-secondary">
                From: City Mall, Mangalore → To: KMC Attavar Hospital
              </p>
              <p className="font-medium text-text-primary">
                ETA: {getEta()} • Distance: {getDistance()}
              </p>
            </div>
          </div>

          <div className="rounded-lg border border-border/50 bg-surface p-4 min-h-[220px]">
            {/* Map would be rendered here */}
            <div className="flex h-full flex-col items-center justify-center text-text-secondary">
              <p className="text-sm font-medium text-text-primary mb-2">Interactive Map Preview</p>
              <p className="text-text-sm text-text-secondary text-center max-w-sm">
                A live map will show the optimal route and traffic flow for emergency dispatch.
              </p>
              <div className="mt-4 flex items-center gap-2">
                <span className="text-xs text-text-secondary">Current Location</span>
                <div className="w-3 h-3 bg-primary rounded-full"></div>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 mb-4">
            <button
              onClick={() => alert('Optimizing route based on traffic...')}
              className="btn-primary px-4 py-2"
            >
              Optimize Route
            </button>
            <button
              onClick={() => alert('Alternative routes calculated')}
              className="btn-outline px-4 py-2"
            >
              Alternative Routes
            </button>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-text-sm text-text-secondary">Traffic Conditions:</span>
              <span className={`font-medium ${trafficCondition === 'Heavy' ? 'text-error' : trafficCondition === 'Moderate' ? 'text-warning' : 'text-success'}`}>
                {trafficCondition}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-text-sm text-text-secondary">Green Corridor:</span>
              <span className={`font-medium ${greenCorridor === 'Active' ? 'text-success' : 'text-secondary'}`}>
                {greenCorridor}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-text-sm text-text-secondary">Hospital ETA:</span>
              <span className="font-medium text-primary">{getEta()}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default NavigationWidget;