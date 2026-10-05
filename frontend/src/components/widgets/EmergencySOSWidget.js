import React, { useState } from 'react';
import Button from '../ui/Button';
import Card from '../ui/Card';
import emergencyService from '../../services/emergencyService';

const EmergencySOSWidget = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleActivateEmergency = async () => {
    setLoading(true);
    setError(null);

    try {
      // Get GPS location if available
      let location = {};
      if (navigator.geolocation) {
        try {
          const position = await new Promise((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 5000 });
          });
          location = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          };
        } catch {
          // Location unavailable, continue without it
          location = { address: 'Location unavailable' };
        }
      }

      const response = await emergencyService.activateSOS({
        type: 'emergency',
        severity: 'critical',
        description: 'Emergency SOS activated from mobile app',
        location
      });
      alert('Emergency SOS activated! Help is on the way.');
      console.log('SOS response:', response);
    } catch (err) {
      console.error('Failed to activate emergency:', err);
      setError('Failed to activate emergency. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card hover className="border-error/30 bg-error/5">
      <CardHeader action={<Badge variant="error" size="sm" dot>Live</Badge>}>
        <CardTitle>🚨 Emergency SOS</CardTitle>
      </CardHeader>
      <CardBody>
        <div className="text-center mb-4">
          <div className="text-4xl mb-2">🚑</div>
          <p className="text-text-secondary text-sm mb-3">
            One-touch emergency activation with GPS location sharing
          </p>
        </div>

        <Button
          variant="error"
          size="lg"
          fullWidth
          onClick={handleActivateEmergency}
          loading={loading}
          disabled={loading}
        >
          {loading ? 'Activating...' : 'Activate Emergency SOS'}
        </Button>

        {error && (
          <Alert variant="error" className="mt-3 text-sm">
            {error}
          </Alert>
        )}

        <div className="mt-4 p-3 bg-warning/10 rounded-lg border border-warning/20">
          <p className="text-xs text-warning-dark font-medium mb-1">⚠️ Important:</p>
          <ul className="text-xs text-text-secondary space-y-1">
            <li>• Your GPS location will be shared with responders</li>
            <li>• Emergency contacts will be notified</li>
            <li>• Real-time ambulance tracking enabled</li>
            <li>• Medical history accessible to responders</li>
          </ul>
        </div>
      </CardBody>
    </Card>
  );
};

export default EmergencySOSWidget;