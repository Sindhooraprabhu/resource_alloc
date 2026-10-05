import React, { useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';
import { MapContainer, Marker, Polyline, TileLayer, useMap } from 'react-leaflet';
import L from 'leaflet';
import ambulanceService from '../../services/ambulanceService';

const defaultPosition = [12.9141, 74.8560];
const ambulanceIcon = new L.DivIcon({
  className: 'ambulance-map-marker',
  html: '<span>🚑</span>',
  iconSize: [34, 34],
  iconAnchor: [17, 17]
});

const RecenterMap = ({ position }) => {
  const map = useMap();
  useEffect(() => {
    if (position) map.setView(position, Math.max(map.getZoom(), 14));
  }, [map, position]);
  return null;
};

const DriverLocationTracker = ({ ambulance, emergency }) => {
  const [position, setPosition] = useState(() => {
    const coordinates = ambulance?.currentLocation?.coordinates;
    return coordinates ? [coordinates[1], coordinates[0]] : null;
  });
  const [tracking, setTracking] = useState(false);
  const [message, setMessage] = useState('GPS is off');
  const watchId = useRef(null);

  useEffect(() => () => {
    if (watchId.current !== null) navigator.geolocation.clearWatch(watchId.current);
  }, []);

  const sendPosition = async ({ coords }) => {
    const nextPosition = [coords.latitude, coords.longitude];
    setPosition(nextPosition);
    setMessage(`Updated ${new Date().toLocaleTimeString()}`);
    try {
      await ambulanceService.updateLocation(ambulance._id, {
        latitude: coords.latitude,
        longitude: coords.longitude
      });
    } catch (error) {
      setMessage(error.message || 'Unable to send GPS update');
    }
  };

  const startTracking = () => {
    if (!navigator.geolocation) {
      setMessage('This device does not support GPS');
      return;
    }
    setTracking(true);
    setMessage('Waiting for GPS permission...');
    watchId.current = navigator.geolocation.watchPosition(sendPosition, error => {
      setTracking(false);
      setMessage(error.message || 'GPS permission is required');
    }, { enableHighAccuracy: true, maximumAge: 5000, timeout: 15000 });
  };

  const stopTracking = () => {
    if (watchId.current !== null) navigator.geolocation.clearWatch(watchId.current);
    watchId.current = null;
    setTracking(false);
    setMessage('GPS is off');
  };

  const hospitalCoordinates = emergency?.assignedHospital?.location?.coordinates;
  const hospitalPosition = hospitalCoordinates ? [hospitalCoordinates[1], hospitalCoordinates[0]] : null;
  const mapPosition = position || hospitalPosition || defaultPosition;
  const path = position && hospitalPosition ? [position, hospitalPosition] : [];
  const socketUrl = (process.env.REACT_APP_API_URL || 'http://localhost:5000/api').replace(/\/api\/?$/, '');

  useEffect(() => {
    if (!ambulance?._id) return undefined;
    const socket = io(socketUrl, { transports: ['websocket', 'polling'] });
    socket.emit('joinAmbulanceRoom', ambulance._id);
    socket.on('ambulanceLocationUpdated', update => {
      if (update.ambulanceId !== ambulance._id) return;
      const coordinates = update.location?.coordinates;
      if (coordinates) setPosition([coordinates[1], coordinates[0]]);
    });
    return () => socket.disconnect();
  }, [ambulance?._id, socketUrl]);

  if (!ambulance) return <div className="bg-surface rounded-xl p-6 text-text-secondary">No ambulance is assigned yet.</div>;

  return (
    <section className="bg-surface rounded-xl shadow-md p-6 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-text-primary">Live ambulance location</h2>
          <p className="text-sm text-text-secondary">{ambulance.vehicleNumber} · {message}</p>
        </div>
        {tracking ? (
          <button onClick={stopTracking} className="btn-outline px-4 py-2">Stop GPS</button>
        ) : (
          <button onClick={startTracking} className="btn-primary px-4 py-2">Start GPS tracking</button>
        )}
      </div>
      <div className="h-[360px] overflow-hidden rounded-lg border border-border/50">
        <MapContainer center={mapPosition} zoom={14} className="h-full w-full" scrollWheelZoom>
          <TileLayer attribution="&copy; OpenStreetMap contributors" url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          <RecenterMap position={position} />
          {position && <Marker position={position} icon={ambulanceIcon} />}
          {hospitalPosition && <Marker position={hospitalPosition} />}
          {path.length > 1 && <Polyline positions={path} pathOptions={{ color: '#22c55e', weight: 5 }} />}
        </MapContainer>
      </div>
      <div className="grid gap-3 text-sm md:grid-cols-3">
        <div><span className="text-text-secondary">Driver</span><p className="font-semibold text-text-primary">{ambulance.crew?.driver?.name || 'Assigned driver'}</p></div>
        <div><span className="text-text-secondary">Current GPS</span><p className="font-semibold text-text-primary">{position ? `${position[0].toFixed(5)}, ${position[1].toFixed(5)}` : 'Waiting for GPS'}</p></div>
        <div><span className="text-text-secondary">Hospital ETA</span><p className="font-semibold text-text-primary">{emergency?.routePlan?.etaMinutes || '--'} min</p></div>
      </div>
    </section>
  );
};

export default DriverLocationTracker;
