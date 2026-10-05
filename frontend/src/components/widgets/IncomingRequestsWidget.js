import React, { useState, useEffect } from 'react';
import emergencyService from '../../services/emergencyService';

const IncomingRequestsWidget = () => {
  const [requests, setRequests] = useState([
    {
      _id: '1',
      emergencyId: 'SOS-2026-8801',
      patient: { name: 'Priya Sharma', age: 34, gender: 'female' },
      type: 'medical',
      subtype: 'cardiac',
      severity: 8,
      symptoms: ['Chest pain', 'Shortness of breath'],
      requiredResource: { bedType: 'ICU', specialist: 'Cardiologist', equipment: 'Ventilator' },
      eta: '8 min',
      caseStatus: 'WAITING FOR CONFIRMATION'
    },
    {
      _id: '2',
      emergencyId: 'SOS-2026-8802',
      patient: { name: 'Rahul Patel', age: 45, gender: 'male' },
      type: 'accident',
      subtype: 'trauma',
      severity: 9,
      symptoms: ['Head injury', 'Bleeding', 'Loss of consciousness'],
      requiredResource: { bedType: 'Emergency', specialist: 'Orthopedic specialist', equipment: 'ECG Machine' },
      eta: '15 min',
      caseStatus: 'WAITING FOR CONFIRMATION'
    }
  ]);

  const [rejectReason, setRejectReason] = useState('');
  const [rejectingId, setRejectingId] = useState(null);
  const [infoId, setInfoId] = useState(null);
  const [infoText, setInfoText] = useState('');

  const fetchActiveRequests = async () => {
    try {
      const active = await emergencyService.getActiveEmergencies();
      if (active && active.length > 0) {
        setRequests(active);
      }
    } catch (err) {
      console.warn('Could not fetch active requests from API, using demo initial requests:', err);
    }
  };

  useEffect(() => {
    fetchActiveRequests();
  }, []);

  const handleAccept = async (id) => {
    try {
      await emergencyService.updateEmergencyStatus(id, { action: 'accept' });
    } catch (err) {
      console.warn('API call offline, applying state locally:', err);
    }
    setRequests(prev => prev.map(req => req._id === id ? { ...req, caseStatus: 'HOSPITAL ACCEPTED' } : req));
    alert('Emergency request ACCEPTED! Resources (1 Bed) temporarily reserved.');
  };

  const handleRejectSubmit = async (id) => {
    try {
      await emergencyService.updateEmergencyStatus(id, { action: 'reject', rejectionReason: rejectReason });
    } catch (err) {
      console.warn('API call offline, applying state locally:', err);
    }
    setRequests(prev => prev.map(req => req._id === id ? { ...req, caseStatus: 'HOSPITAL REJECTED' } : req));
    setRejectingId(null);
    setRejectReason('');
    alert('Emergency request REJECTED. The AI Allocation Engine is automatically re-routing to the next best hospital.');
  };

  const handleInfoSubmit = async (id) => {
    try {
      await emergencyService.updateEmergencyStatus(id, { action: 'needs_info', infoRequest: infoText });
    } catch (err) {
      console.warn('API call offline:', err);
    }
    setInfoId(null);
    setInfoText('');
    alert('Information request sent to dispatch/patient.');
  };

  return (
    <div className="bg-surface rounded-xl shadow-md p-6 border border-border/40">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-text-lg font-semibold text-text-primary">Incoming Emergency Requests</h2>
          <p className="text-xs text-text-secondary">AI-directed patient arrivals requiring hospital confirmation</p>
        </div>
        <button onClick={fetchActiveRequests} className="btn-outline btn-sm p-2 text-xs">
          Refresh List
        </button>
      </div>

      <div className="space-y-4">
        {requests.map(request => (
          <div key={request._id} className="border border-border/60 rounded-xl p-4 bg-background/30">
            <div className="flex items-center justify-between mb-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-text-primary">{request.patient?.name || 'Emergency Patient'}</span>
                  <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded font-mono font-bold">
                    {request.emergencyId}
                  </span>
                </div>
                <p className="text-xs text-text-secondary mt-0.5">
                  Age: {request.patient?.age || '40'} yrs • Type: {request.subtype || request.type}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                  request.severity >= 8 ? 'bg-error/20 text-error border border-error/30' : 'bg-warning/20 text-warning'
                }`}>
                  Severity: {request.severity}/10
                </span>
                <span className="text-xs font-bold text-primary bg-primary/10 px-2 py-1 rounded-md">
                  ETA: {request.eta || '10 min'}
                </span>
              </div>
            </div>

            {/* Required Resources Badge */}
            <div className="bg-surface p-3 rounded-lg border border-border/50 mb-3 grid grid-cols-1 md:grid-cols-3 gap-2">
              <div className="text-xs">
                <span className="text-text-secondary block">Required Bed:</span>
                <strong className="text-primary">{request.requiredResource?.bedType || 'ICU'}</strong>
              </div>
              <div className="text-xs">
                <span className="text-text-secondary block">Required Specialist:</span>
                <strong className="text-text-primary">{request.requiredResource?.specialist || 'Cardiologist'}</strong>
              </div>
              <div className="text-xs">
                <span className="text-text-secondary block">Equipment Needed:</span>
                <strong className="text-text-primary">{request.requiredResource?.equipment || 'Ventilator'}</strong>
              </div>
            </div>

            {/* Status and Action Buttons */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-border/40">
              <div className="flex items-center gap-2">
                <span className="text-xs text-text-secondary">Case Status:</span>
                <span className={`text-xs font-bold px-2 py-0.5 rounded ${
                  request.caseStatus === 'HOSPITAL ACCEPTED' ? 'bg-success/20 text-success' :
                  request.caseStatus === 'HOSPITAL REJECTED' ? 'bg-error/20 text-error' :
                  'bg-warning/20 text-warning'
                }`}>
                  {request.caseStatus}
                </span>
              </div>

              {request.caseStatus === 'WAITING FOR CONFIRMATION' && (
                <div className="flex gap-2">
                  <button
                    onClick={() => handleAccept(request._id)}
                    className="btn-success px-3 py-1.5 text-xs font-bold"
                  >
                    ACCEPT
                  </button>
                  <button
                    onClick={() => setRejectingId(request._id)}
                    className="btn-error px-3 py-1.5 text-xs font-bold"
                  >
                    REJECT
                  </button>
                  <button
                    onClick={() => setInfoId(request._id)}
                    className="btn-outline px-3 py-1.5 text-xs font-semibold"
                  >
                    NEEDS INFO
                  </button>
                </div>
              )}
            </div>

            {/* Rejection Prompt */}
            {rejectingId === request._id && (
              <div className="mt-3 p-3 bg-error/10 border border-error/30 rounded-lg">
                <p className="text-xs font-bold text-error mb-2">Specify Rejection Reason:</p>
                <select
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  className="w-full text-xs p-2 border rounded mb-2"
                >
                  <option value="">Select reason...</option>
                  <option value="No ICU Beds Available">No ICU Beds Available</option>
                  <option value="Specialist Off-Duty">Specialist Off-Duty</option>
                  <option value="Operation Theatre Full">Operation Theatre Full</option>
                  <option value="Hospital Capacity Overload">Hospital Capacity Overload</option>
                </select>
                <div className="flex gap-2 justify-end">
                  <button onClick={() => setRejectingId(null)} className="btn-outline text-xs px-2 py-1">Cancel</button>
                  <button onClick={() => handleRejectSubmit(request._id)} className="btn-error text-xs px-3 py-1 font-bold">Confirm Rejection</button>
                </div>
              </div>
            )}

            {/* Needs Info Prompt */}
            {infoId === request._id && (
              <div className="mt-3 p-3 bg-primary/10 border border-primary/30 rounded-lg">
                <p className="text-xs font-bold text-primary mb-2">Request Additional Info from Dispatch:</p>
                <input
                  type="text"
                  value={infoText}
                  onChange={(e) => setInfoText(e.target.value)}
                  placeholder="e.g. Confirm patient SpO2 level..."
                  className="w-full text-xs p-2 border rounded mb-2"
                />
                <div className="flex gap-2 justify-end">
                  <button onClick={() => setInfoId(null)} className="btn-outline text-xs px-2 py-1">Cancel</button>
                  <button onClick={() => handleInfoSubmit(request._id)} className="btn-primary text-xs px-3 py-1 font-bold">Send Request</button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default IncomingRequestsWidget;