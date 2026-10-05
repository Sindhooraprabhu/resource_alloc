import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';
import { useAuth } from '../contexts/AuthContext';
import emergencyService from '../services/emergencyService';
import allocationService from '../services/allocationService';
import notificationService from '../services/notificationService';
import { Button, Card, Badge, LoadingSpinner, Modal, Alert, Tabs, Input } from '../components/ui';
import { HospitalCard } from '../components/data';
import NotificationCenterWidget from '../components/widgets/NotificationCenterWidget';

const EmergencySOS = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  // State management
  const [step, setStep] = useState('type-select'); // type-select, active, completed
  const [emergencyType, setEmergencyType] = useState('medical');
  const [subtype, setSubtype] = useState('cardiac');
  const [phone, setPhone] = useState('');
  const [patientName, setPatientName] = useState('');
  const [patientAge, setPatientAge] = useState('');
  const [patientGender, setPatientGender] = useState('');
  const [symptoms, setSymptoms] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState({ latitude: null, longitude: null, address: 'Acquiring location...' });
  const [countdown, setCountdown] = useState(10);
  const [countdownActive, setCountdownActive] = useState(false);
  const [emergency, setEmergency] = useState(null);
  const [recommendations, setRecommendations] = useState([]);
  const [selectedHospital, setSelectedHospital] = useState(null);
  const [requirements, setRequirements] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [ambulanceLive, setAmbulanceLive] = useState(null);

  // Emergency type configurations
  const emergencyTypes = [
    {
      id: 'medical',
      label: 'Medical Emergency',
      icon: '🏥',
      color: 'error',
      variant: 'error',
      subtypes: ['cardiac', 'respiratory', 'neurological', 'trauma', 'obstetric', 'pediatric', 'geriatric', 'psychiatric', 'toxicological']
    },
    {
      id: 'accident',
      label: 'Accident / Trauma',
      icon: '🚗',
      color: 'warning',
      variant: 'warning',
      subtypes: ['rta', 'fall', 'burn', 'drowning', 'electrocution']
    },
    {
      id: 'fire',
      label: 'Fire / Rescue',
      icon: '🔥',
      color: 'warning',
      variant: 'secondary',
      subtypes: ['structural', 'vehicle', 'wildfire', 'chemical']
    },
    {
      id: 'crime',
      label: 'Crime / Violence',
      icon: '🚨',
      color: 'primary',
      variant: 'primary',
      subtypes: ['assault', 'robbery', 'shooting', 'stabbing']
    },
  ];

  // Get user location
  const getLocation = useCallback(async () => {
    if (!navigator.geolocation) {
      setLocation({
        latitude: 12.9141,
        longitude: 74.8560,
        address: 'City Mall, Mangalore (Default)'
      });
      return;
    }

    try {
      const position = await new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0
        });
      });

      const { latitude, longitude } = position.coords;

      // Reverse geocode (simplified - in production use a geocoding service)
      setLocation({
        latitude,
        longitude,
        address: `Lat: ${latitude.toFixed(4)}, Lng: ${longitude.toFixed(4)}`
      });
    } catch (err) {
      console.warn('Geolocation failed, using default:', err);
      setLocation({
        latitude: 12.9141,
        longitude: 74.8560,
        address: 'City Mall, Mangalore (Default)'
      });
    }
  }, []);

  useEffect(() => {
    getLocation();
  }, [getLocation]);

  // VAPID public key for push notifications
  const VAPID_PUBLIC_KEY = 'BEKPNFalg6ZSuvkecvg96U7rvT74vEyhLTLIajqXRF22LS0eS6XT5hWSicsd_Gpjd_sD7Te32xpmxHUutFWApgg';

  function urlBase64ToUint8Array(base64String) {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  }

  useEffect(() => {
    // Initialize push notifications on component mount
    if ('serviceWorker' in navigator && 'PushManager' in window) {
      navigator.serviceWorker.ready.then(async (registration) => {
        try {
          // Request notification permission
          const permission = await Notification.requestPermission();
          console.log('Notification permission:', permission);
          
          // Check if already subscribed
          let subscription = await registration.pushManager.getSubscription();
          
          if (!subscription) {
            // Subscribe to push
            subscription = await registration.pushManager.subscribe({
              userVisibleOnly: true,
              applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY)
            });
            console.log('Push subscription created:', subscription);
          }
        } catch (err) {
          console.warn('Push notification setup failed:', err);
        }
      });
    }
  }, []);

  useEffect(() => {
    if (step !== 'active' || !emergency?._id) return undefined;

    let mounted = true;
    const refreshCase = async () => {
      try {
        const status = await allocationService.getAllocationStatus(emergency._id);
        if (!mounted) return;
        setEmergency(current => ({ ...current, ...status.emergency }));
        if (status.emergency.requiredResource) setRequirements(status.emergency.requiredResource);
        if (status.emergency.assignedHospital) {
          setSelectedHospital(current => current || {
            ...status.emergency.assignedHospital,
            name: status.emergency.assignedHospital.name,
            hospitalId: status.emergency.assignedHospital._id,
            travelTime: status.emergency.routePlan?.etaMinutes
          });
        }
      } catch (err) {
        if (mounted) console.warn('Unable to refresh emergency status:', err);
      }
    };

    refreshCase();
    const interval = setInterval(refreshCase, 5000);
    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, [emergency?._id, step]);

  useEffect(() => {
    if (step !== 'active' || !emergency?._id) return undefined;
    const socketUrl = (process.env.REACT_APP_API_URL || 'http://localhost:5000/api').replace(/\/api\/?$/, '');
    const socket = io(socketUrl, { transports: ['websocket', 'polling'] });
    socket.emit('joinEmergencyRoom', emergency._id);

    // Register for push notifications for this emergency
    notificationService.subscribeToPush().then(subscription => {
      if (subscription) {
        notificationService.sendSubscriptionToBackend(emergency._id);
      }
    });

    const addNotification = (notification) => {
      setNotifications(current => [notification, ...current].slice(0, 8));
      // Also store in localStorage for persistence
      notificationService.storeNotification({
        title: 'Emergency Update',
        body: notification.description,
        data: { emergencyId: emergency._id, ...notification.metadata }
      });
    };
    socket.on('patientNotification', addNotification);
    socket.on('ambulanceLocationUpdated', (update) => {
      setAmbulanceLive(update);
      addNotification({ description: 'Ambulance location updated', metadata: update });
    });
    socket.on('ambulanceStatusUpdated', (update) => {
      setEmergency(current => ({ ...current, assignedAmbulance: { ...(current.assignedAmbulance || {}), ...update } }));
      addNotification({ description: `Ambulance status: ${update.status}`, metadata: update });
    });
    socket.on('routingUpdated', (update) => {
      if (update.emergency) setEmergency(current => ({ ...current, ...update.emergency }));
      addNotification({ description: update.changedHospital ? 'Hospital changed after live route refresh' : 'Route recalculated', metadata: update });
    });
    socket.on('emergencyUpdated', addNotification);
    return () => socket.disconnect();
  }, [emergency?._id, step]);

  // Start countdown timer
  const startCountdown = useCallback(() => {
    setCountdown(10);
    setCountdownActive(true);

    const interval = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(interval);
          setCountdownActive(false);
          handleConfirmEmergency();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  // Handle emergency type selection
  const handleTypeChange = (event) => {
    const nextType = event.target.value;
    const config = emergencyTypes.find(type => type.id === nextType);
    setEmergencyType(nextType);
    setSubtype(config?.subtypes[0] || 'other');
  };

  // Cancel emergency
  const handleCancel = () => {
    if (step === 'confirming' && countdownActive) {
      setShowCancelConfirm(true);
    } else {
      resetEmergency();
      navigate('/emergency');
    }
  };

  const confirmCancel = () => {
    setShowCancelConfirm(false);
    setCountdownActive(false);
    resetEmergency();
    navigate('/emergency');
  };

  // Reset emergency state
  const resetEmergency = () => {
    setStep('type-select');
    setEmergencyType('medical');
    setSubtype('cardiac');
    setPhone('');
    setPatientName('');
    setPatientAge('');
    setPatientGender('');
    setSymptoms('');
    setDescription('');
    setLocation({ latitude: null, longitude: null, address: 'Acquiring location...' });
    setCountdown(10);
    setCountdownActive(false);
    setEmergency(null);
    setRecommendations([]);
    setSelectedHospital(null);
    setRequirements(null);
    setError(null);
    setNotifications([]);
    setAmbulanceLive(null);
  };

  // Confirm emergency activation
  const handleConfirmEmergency = async () => {
    if (!emergencyType) return;

    setLoading(true);
    setError(null);

    try {
      const selectedType = emergencyTypes.find(t => t.id === emergencyType);
      const symptomList = symptoms.split(',').map(item => item.trim()).filter(Boolean);

      const emergencyData = {
        type: emergencyType,
        subtype,
        latitude: location.latitude,
        longitude: location.longitude,
        address: location.address,
        description: description || `Emergency reported via the app - ${selectedType?.label}`,
        additionalDetails: description,
        symptoms: symptomList,
        patient: {
          name: patientName || user?.name || undefined,
          age: patientAge ? Number(patientAge) : undefined,
          gender: patientGender || undefined,
        },
        contactPerson: { name: patientName || user?.name || 'Emergency caller', phone },
        severity: emergencyType === 'medical' ? 7 : 5,
      };

      const response = await emergencyService.activateSOS(emergencyData);

      setEmergency(response.emergency);
      setRecommendations(response.recommendations || []);
      setRequirements(response.requirements || null);

      if (response.recommendations?.length > 0) {
        setSelectedHospital(response.recommendations[0]);
      }

      // Register push subscription for this emergency
      if ('serviceWorker' in navigator && 'PushManager' in window) {
        try {
          const registration = await navigator.serviceWorker.ready;
          let subscription = await registration.pushManager.getSubscription();
          if (!subscription) {
            subscription = await registration.pushManager.subscribe({
              userVisibleOnly: true,
              applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY)
            });
          }
          // Send subscription to backend
          await emergencyService.savePushSubscription(response.emergency._id, subscription.toJSON());
          console.log('Push subscription saved to backend for emergency:', response.emergency._id);
        } catch (err) {
          console.warn('Failed to save push subscription:', err);
        }
      }

      setStep('active');
    } catch (err) {
      setError(err.message || 'Failed to activate emergency. Please try again.');
      setStep('type-select');
    } finally {
      setLoading(false);
    }
  };

  // Handle hospital selection
  const handleHospitalSelect = (hospital) => {
    setSelectedHospital(hospital);
  };

  // Render step: Type Selection
  const renderTypeSelection = () => (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-3xl mx-auto py-8">
        <div className="mb-8">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-semibold uppercase tracking-widest text-error">Emergency intake</p>
              <h1 className="text-3xl font-bold text-text-primary mt-2">Request emergency assistance</h1>
              <p className="text-text-secondary mt-2">No account is required. Give the control centre enough detail to find the right hospital and resources.</p>
            </div>
            <Link to="/login" className="shrink-0 text-sm font-semibold text-primary hover:underline">Admin sign in</Link>
          </div>
        </div>

        <Card>
          <Card.Body>
            <form onSubmit={(event) => { event.preventDefault(); handleConfirmEmergency(); }} className="space-y-5">
              <div className="grid gap-5 md:grid-cols-2">
                <label className="block">
                  <span className="text-sm font-medium text-text-primary">Emergency type</span>
                  <select value={emergencyType} onChange={handleTypeChange} className="input mt-2 w-full">
                    {emergencyTypes.map(type => <option key={type.id} value={type.id}>{type.label}</option>)}
                  </select>
                </label>
                <label className="block">
                  <span className="text-sm font-medium text-text-primary">Condition</span>
                  <select value={subtype} onChange={(event) => setSubtype(event.target.value)} className="input mt-2 w-full">
                    {(emergencyTypes.find(type => type.id === emergencyType)?.subtypes || ['other']).map(item => <option key={item} value={item}>{item}</option>)}
                  </select>
                </label>
              </div>

              <label className="block">
                <span className="text-sm font-medium text-text-primary">Symptoms or immediate needs</span>
                <input value={symptoms} onChange={(event) => setSymptoms(event.target.value)} className="input mt-2 w-full" placeholder="Chest pain, breathing difficulty, bleeding" required />
                <span className="text-xs text-text-secondary">Separate multiple symptoms with commas.</span>
              </label>

              <div className="grid gap-5 md:grid-cols-2">
                <label className="block">
                  <span className="text-sm font-medium text-text-primary">Caller phone number</span>
                  <input value={phone} onChange={(event) => setPhone(event.target.value)} className="input mt-2 w-full" type="tel" placeholder="10-digit mobile number" required />
                </label>
                <label className="block">
                  <span className="text-sm font-medium text-text-primary">Incident address</span>
                  <input value={location.address} onChange={(event) => setLocation(current => ({ ...current, address: event.target.value }))} className="input mt-2 w-full" required />
                </label>
              </div>

              <div className="grid gap-5 md:grid-cols-3">
                <label className="block"><span className="text-sm font-medium text-text-primary">Patient name</span><input value={patientName} onChange={(event) => setPatientName(event.target.value)} className="input mt-2 w-full" /></label>
                <label className="block"><span className="text-sm font-medium text-text-primary">Age</span><input value={patientAge} onChange={(event) => setPatientAge(event.target.value)} className="input mt-2 w-full" type="number" min="0" max="150" /></label>
                <label className="block"><span className="text-sm font-medium text-text-primary">Gender</span><select value={patientGender} onChange={(event) => setPatientGender(event.target.value)} className="input mt-2 w-full"><option value="">Not provided</option><option value="male">Male</option><option value="female">Female</option><option value="other">Other</option></select></label>
              </div>

              <label className="block"><span className="text-sm font-medium text-text-primary">Additional details</span><textarea value={description} onChange={(event) => setDescription(event.target.value)} className="input mt-2 w-full min-h-24" placeholder="What happened? Any known conditions, allergies, or access instructions?" /></label>

              <div className="flex items-center justify-between gap-4 border-t border-border pt-5">
                <p className="text-xs text-text-secondary">Location: {location.latitude && location.longitude ? `${location.latitude.toFixed(4)}, ${location.longitude.toFixed(4)}` : 'Acquiring GPS location...'}</p>
                <Button variant="error" type="submit" loading={loading} disabled={loading}>Send emergency request</Button>
              </div>
            </form>
          </Card.Body>
        </Card>
      </div>
    </div>
  );

  // Render step: Confirming
  const renderConfirming = () => {
    const selectedType = emergencyTypes.find(t => t.id === emergencyType);

    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-full max-w-md p-8 bg-surface rounded-xl shadow-md text-center">
          <div className="mb-6">
            <div className="text-4xl font-bold text-error mb-2">🚨</div>
            <h2 className="text-2xl font-bold text-text-primary mb-2">Emergency Activated</h2>
            <p className="text-text-lg text-text-secondary mb-4">Help is on the way</p>
          </div>

          <div className="space-y-4 text-left">
            <div className="p-3 bg-primary/5 rounded-lg">
              <h3 className="font-medium text-text-primary mb-2">Emergency Details</h3>
              <p className="text-text-sm"><strong>Type:</strong> {selectedType?.label}</p>
              <p className="text-text-sm"><strong>Location:</strong> {location.address}</p>
              {description && <p className="text-text-sm"><strong>Description:</strong> {description}</p>}
            </div>

            <div className="mb-6">
              <h3 className="font-medium text-text-primary mb-2">Auto-confirm in</h3>
              <div className="text-5xl font-bold text-error mb-3">{countdown}</div>
              <p className="text-text-sm text-text-secondary">
                Confirm emergency or wait for automatic activation
              </p>
              <div className="flex gap-3 mt-4">
                <Button
                  variant="outline"
                  onClick={handleCancel}
                  className="flex-1"
                >
                  Cancel Emergency
                </Button>
                <Button
                  variant="error"
                  onClick={handleConfirmEmergency}
                  className="flex-1"
                >
                  Confirm Now
                </Button>
              </div>
            </div>
          </div>
        </div>

        {showCancelConfirm && (
          <Modal
            isOpen={showCancelConfirm}
            onClose={() => setShowCancelConfirm(false)}
            title="Cancel Emergency?"
            size="sm"
          >
            <p className="text-text-secondary mb-6">Are you sure you want to cancel this emergency activation?</p>
            <div className="flex gap-3 justify-end">
              <Button variant="outline" onClick={() => setShowCancelConfirm(false)}>No, Keep Active</Button>
              <Button variant="error" onClick={confirmCancel}>Yes, Cancel</Button>
            </div>
          </Modal>
        )}
      </div>
    );
  };

  // Render step: Active (showing recommendations)
  const renderActive = () => {
    const selectedType = emergencyTypes.find(t => t.id === emergencyType);
    const statusSteps = [
      ['REQUESTED', 'Request received'],
      ['HOSPITAL SEARCH', 'Checking resources'],
      ['WAITING FOR CONFIRMATION', 'Hospital recommended'],
      ['HOSPITAL ACCEPTED', 'Hospital confirmed'],
      ['AMBULANCE DISPATCHED', 'Resources reserved'],
      ['AMBULANCE EN ROUTE', 'Ambulance assigned'],
    ];
    const currentStatusIndex = Math.max(0, statusSteps.findIndex(([status]) => status === emergency?.caseStatus));
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          <header className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h1 className="text-2xl font-bold text-text-primary">Emergency Active</h1>
                <p className="text-text-secondary">SOS-{emergency?.emergencyId?.split('-').pop() || 'ACTIVE'}</p>
              </div>
              <div className="flex items-center gap-3">
                <Link to={`/emergency-case/${emergency?._id}`} className="btn-outline px-3 py-2 text-xs">Open case page</Link>
                <Badge variant="error" size="lg" dot className="text-sm">LIVE</Badge>
              </div>
            </div>
          </header>

          <Card className="mb-6">
            <Card.Header>
              <Card.Title subtitle="Updates are based on recorded system and hospital actions">Emergency progress</Card.Title>
            </Card.Header>
            <Card.Body>
              <div className="grid gap-3 md:grid-cols-6">
                {statusSteps.map(([status, label], index) => (
                  <div key={status} className="flex items-center gap-2 md:block">
                    <div className={`h-3 w-3 rounded-full md:mb-2 ${index <= currentStatusIndex ? 'bg-success' : 'bg-border'}`} />
                    <p className={`text-xs ${index <= currentStatusIndex ? 'font-semibold text-text-primary' : 'text-text-secondary'}`}>{label}</p>
                  </div>
                ))}
              </div>
            </Card.Body>
          </Card>

          {error && (
            <Alert variant="error" dismissible onDismiss={() => setError(null)} className="mb-6">
              {error}
            </Alert>
          )}

          {notifications.length > 0 && (
            <Card className="mb-6">
              <Card.Header>
                <Card.Title subtitle="Updates are stored in the emergency timeline">Live operations updates</Card.Title>
              </Card.Header>
              <Card.Body>
                <div className="space-y-2">
                  {notifications.slice(0, 4).map((notification, index) => (
                    <div key={`${notification.event || 'update'}-${index}`} className="flex items-start justify-between gap-4 rounded-lg border border-border/50 px-3 py-2 text-sm">
                      <span className="text-text-primary">{notification.description || 'Emergency status updated'}</span>
                      <span className="shrink-0 text-xs text-text-secondary">Live</span>
                    </div>
                  ))}
                </div>
              </Card.Body>
            </Card>
          )}

          {/* Emergency Status Card */}
          <Card className="mb-6">
            <Card.Header>
              <Card.Title subtitle="Real-time emergency status">Status Overview</Card.Title>
            </Card.Header>
            <Card.Body>
              <div className="grid gap-4 md:grid-cols-4">
                <div className="text-center p-4 bg-primary/5 rounded-lg">
                  <div className="text-2xl font-bold text-primary">🚑</div>
                  <div className="text-sm text-text-secondary">Ambulance</div>
                  <div className="font-medium text-text-primary">{emergency?.assignedAmbulance?.vehicleNumber || 'Assigning'}</div>
                  {(ambulanceLive?.location?.coordinates || emergency?.patientHandover?.ambulanceLocation) && (
                    <div className="text-xs text-text-secondary">
                      Live location: {ambulanceLive?.location?.coordinates
                        ? `${ambulanceLive.location.coordinates[1].toFixed(4)}, ${ambulanceLive.location.coordinates[0].toFixed(4)}`
                        : `${emergency.patientHandover.ambulanceLocation.latitude}, ${emergency.patientHandover.ambulanceLocation.longitude}`}
                    </div>
                  )}
                </div>
                <div className="text-center p-4 bg-success/5 rounded-lg">
                  <div className="text-2xl font-bold text-success">🏥</div>
                  <div className="text-sm text-text-secondary">Hospital</div>
                  <div className="font-medium text-text-primary">{emergency?.assignedHospital?.name || selectedHospital?.name || 'Evaluating'}</div>
                </div>
                <div className="text-center p-4 bg-warning/5 rounded-lg">
                  <div className="text-2xl font-bold text-warning">⏱️</div>
                  <div className="text-sm text-text-secondary">ETA</div>
                  <div className="font-medium text-text-primary">{emergency?.routePlan?.etaMinutes || selectedHospital?.travelTime || '--'} min</div>
                </div>
                <div className="text-center p-4 bg-secondary/5 rounded-lg">
                  <div className="text-2xl font-bold text-secondary">📍</div>
                  <div className="text-sm text-text-secondary">Distance</div>
                  <div className="font-medium text-text-primary">{emergency?.routePlan?.distanceKm || selectedHospital?.distance?.toFixed(1) || '--'} km</div>
                </div>
              </div>
            </Card.Body>
          </Card>

          <Card className="mb-6">
            <Card.Header>
              <Card.Title subtitle="Live allocation record">Case and allocation detail</Card.Title>
            </Card.Header>
            <Card.Body>
              <div className="grid gap-4 md:grid-cols-3 text-sm">
                <div><p className="text-text-secondary">Patient</p><p className="font-semibold text-text-primary">{emergency?.patient?.name || 'Not provided'}{emergency?.patient?.age ? `, ${emergency.patient.age}` : ''}</p></div>
                <div><p className="text-text-secondary">Severity / condition</p><p className="font-semibold text-text-primary">{emergency?.severity || '--'}/10 · {emergency?.subtype || emergencyType}</p></div>
                <div><p className="text-text-secondary">Current location</p><p className="font-semibold text-text-primary">{emergency?.address || location.address}</p></div>
                <div><p className="text-text-secondary">Specialist / doctor</p><p className="font-semibold text-text-primary">{emergency?.assignedDoctor?.name || requirements?.specialist || 'Pending assignment'}</p></div>
                <div><p className="text-text-secondary">Blood / bed requirement</p><p className="font-semibold text-text-primary">{emergency?.patient?.bloodGroup || 'Blood not provided'} · {requirements?.bedType || 'Emergency bed'}</p></div>
                <div><p className="text-text-secondary">Reservation</p><p className="font-semibold text-text-primary">{emergency?.resourceAllocation?.status || 'PENDING'}</p></div>
              </div>
              <div className="mt-5 rounded-lg border border-border/50 bg-background/40 p-4 text-sm">
                <p className="font-semibold text-text-primary">Route: {emergency?.routePlan?.algorithm || 'Pending route calculation'}</p>
                <p className="mt-1 text-text-secondary">{emergency?.routePlan?.path?.length || 0} route points · {emergency?.routePlan?.traffic || 'light'} traffic model</p>
              </div>
            </Card.Body>
          </Card>

          {/* Required Resources Identified */}
          {requirements && (
            <Card className="mb-6">
              <Card.Header>
                <Card.Title subtitle="Dynamically determined from emergency details">
                  🏥 Required Resources Identified
                </Card.Title>
              </Card.Header>
              <Card.Body>
                <div className="grid gap-4 md:grid-cols-3">
                  <div className="p-4 bg-primary/5 rounded-lg text-center">
                    <p className="text-xs text-text-secondary mb-1">Required Bed</p>
                    <p className="text-xl font-bold text-primary">{requirements.bedType || 'Emergency'}</p>
                  </div>
                  <div className="p-4 bg-primary/5 rounded-lg text-center">
                    <p className="text-xs text-text-secondary mb-1">Required Specialist</p>
                    <p className="text-xl font-bold text-primary">{requirements.specialist || 'Emergency physician'}</p>
                  </div>
                  <div className="p-4 bg-primary/5 rounded-lg text-center">
                    <p className="text-xs text-text-secondary mb-1">Equipment Needed</p>
                    <p className="text-xl font-bold text-primary">
                      {Array.isArray(requirements.equipment) ? requirements.equipment.join(', ') : (requirements.equipment || 'None')}
                    </p>
                  </div>
                </div>
                {requirements.notes && (
                  <p className="text-sm text-text-secondary mt-3 text-center">{requirements.notes}</p>
                )}
              </Card.Body>
            </Card>
          )}

          {/* AI Hospital Recommendations */}
          <Card className="mb-6">
            <Card.Header>
              <Card.Title subtitle="AI-powered allocation based on resources, distance, and capacity">
                🤖 Hospital Recommendations
              </Card.Title>
            </Card.Header>
            <Card.Body>
              {recommendations.length > 0 && (
                <div className="space-y-3">
                  {recommendations.map((rec, index) => {
                    const isSelected = selectedHospital?.hospitalId === rec.hospitalId ||
                      selectedHospital?._id === rec.hospitalId;
                    return (
                      <HospitalCard
                        key={rec.hospitalId || index}
                        hospital={{
                          ...rec,
                          name: rec.name,
                          code: rec.hospitalId?.slice(-6).toUpperCase(),
                          area: 'Mangalore',
                          address: { street: 'Main Road', city: 'Mangalore' },
                          hospitalType: 'Super Specialty',
                          status: 'operational',
                          resources: {
                            beds: {
                              available: 10,
                              total: 100,
                              icuAvailable: rec.reasons?.some(r => r.includes('ICU')) ? 5 : 2,
                            },
                            equipment: { ventilatorsAvailable: rec.reasons?.some(r => r.includes('Ventilator')) ? 3 : 1 },
                            emergencyCapacity: { acceptingEmergencyPatients: true }
                          },
                          distance: rec.distance,
                        }}
                        variant="compact"
                        onClick={() => handleHospitalSelect(rec)}
                        className={isSelected ? 'ring-2 ring-primary' : ''}
                      />
                    );
                  })}
                </div>
              )}
              {recommendations.length === 0 && (
                <div className="text-center py-8 text-text-secondary">
                  {emergency?.caseStatus === 'HOSPITAL SEARCH' ? (
                    <>
                      <p className="font-semibold text-text-primary">Request received</p>
                      <p className="mt-1">Admin is checking live hospital resources. This case remains active.</p>
                    </>
                  ) : (
                    <><p>Evaluating hospitals...</p><LoadingSpinner size="md" className="mx-auto mt-2" /></>
                  )}
                </div>
              )}

              {selectedHospital && (
                <div className="mt-4 p-4 bg-success/5 rounded-lg border border-success/20">
                  <div>
                    <div>
                      <p className="font-medium text-success">AI recommendation</p>
                      <p className="text-sm text-text-secondary">{selectedHospital.name} - {selectedHospital.travelTime} min ETA</p>
                    </div>
                    <p className="text-xs text-text-secondary mt-2">The operations administrator confirms the hospital and locks resources.</p>
                  </div>
                </div>
              )}
            </Card.Body>
          </Card>

          {/* Emergency Details */}
          <Card>
            <Card.Header>
              <Card.Title>Emergency Details</Card.Title>
            </Card.Header>
            <Card.Body>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-text-secondary">Emergency ID</span>
                  <span className="font-mono font-medium">SOS-{emergency?.emergencyId?.split('-').pop()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-secondary">Type</span>
                  <span className="font-medium">{selectedType?.label}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-secondary">Location</span>
                  <span className="font-medium truncate max-w-xs">{location.address}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-secondary">Status</span>
                  <Badge variant="error" dot>Active</Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-secondary">Reported By</span>
                  <span className="font-medium">{user?.name || 'Citizen'}</span>
                </div>
              </div>
            </Card.Body>
          </Card>
        </div>
        <NotificationCenterWidget emergencyId={emergency?._id} />
      </div>
    );
  };

  // Render step: Completed
  const renderCompleted = () => (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="w-full max-w-md p-8 bg-surface rounded-xl shadow-md text-center">
        <div className="text-6xl mb-4">✅</div>
        <h2 className="text-2xl font-bold text-text-primary mb-2">Emergency Confirmed</h2>
        <p className="text-text-secondary mb-6">
          Ambulance dispatched to {selectedHospital?.name || 'selected hospital'}.
          ETA: {selectedHospital?.travelTime || '8-12'} minutes.
        </p>

        <Card variant="outline" className="mb-6">
          <Card.Body className="text-left space-y-3">
            <div className="flex justify-between">
              <span className="text-text-secondary">Emergency ID</span>
              <span className="font-mono font-medium">SOS-{emergency?.emergencyId?.split('-').pop()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-text-secondary">Hospital</span>
              <span className="font-medium">{selectedHospital?.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-text-secondary">Ambulance ETA</span>
              <span className="font-medium text-success">{selectedHospital?.travelTime} min</span>
            </div>
          </Card.Body>
        </Card>

        <div className="flex gap-3">
          <Button variant="outline" onClick={() => navigate('/emergency')} className="flex-1">
            User Portal
          </Button>
          <Button variant="primary" onClick={() => navigate('/patient/monitoring')} className="flex-1">
            Monitor Patient
          </Button>
        </div>
      </div>
    </div>
  );

  // Main render
  switch (step) {
    case 'type-select':
      return renderTypeSelection();
    case 'confirming':
      return renderConfirming();
    case 'active':
      return renderActive();
    case 'completed':
      return renderCompleted();
    default:
      return renderTypeSelection();
  }
};

export default EmergencySOS;