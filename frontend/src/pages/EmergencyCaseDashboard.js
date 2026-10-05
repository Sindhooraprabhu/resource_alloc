import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import allocationService from '../services/allocationService';
import DashboardLayout from '../components/ui/DashboardLayout';
import { LoadingSpinner, Alert } from '../components/ui';

const EmergencyCaseDashboard = () => {
    const { emergencyId } = useParams();
    const { user } = useAuth();
    const navigate = useNavigate();
    const isAdmin = user?.role === 'admin';

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [caseData, setCaseData] = useState(null);
    const [allocationHistory, setAllocationHistory] = useState([]);
    const [activeTab, setActiveTab] = useState('overview');
    const [actionLoading, setActionLoading] = useState(false);
    const [actionMessage, setActionMessage] = useState(null);

    const fetchCaseData = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const status = await allocationService.getAllocationStatus(emergencyId);
            setCaseData(status.emergency);
            setAllocationHistory(status.allocationHistory || []);
        } catch (err) {
            console.error('Failed to fetch case data:', err);
            setError(err.message || 'Failed to load emergency case');
        } finally {
            setLoading(false);
        }
    }, [emergencyId]);

    useEffect(() => {
        fetchCaseData();
    }, [fetchCaseData]);

    const handleConfirm = async () => {
        setActionLoading(true);
        setActionMessage(null);
        try {
            const result = await allocationService.confirmAllocation(emergencyId, {
                hospitalId: caseData?.assignedHospital?._id || caseData?.assignedHospital,
            });
            setActionMessage({ type: 'success', text: 'Hospital confirmed. Resources locked and ambulance dispatched.' });
            await fetchCaseData();
        } catch (err) {
            setActionMessage({ type: 'error', text: err.message || 'Failed to confirm hospital' });
        } finally {
            setActionLoading(false);
        }
    };

    const handleReject = async () => {
        setActionLoading(true);
        setActionMessage(null);
        try {
            const result = await allocationService.rejectAllocation(emergencyId, {
                hospitalId: caseData?.assignedHospital?._id || caseData?.assignedHospital,
                rejectionReason: 'Manual rejection from dashboard',
            });
            setActionMessage({ type: 'success', text: 'Hospital rejected. Reallocating to next best hospital...' });
            await fetchCaseData();
        } catch (err) {
            setActionMessage({ type: 'error', text: err.message || 'Failed to reject hospital' });
        } finally {
            setActionLoading(false);
        }
    };

    const handleComplete = async (cancel = false) => {
        setActionLoading(true);
        setActionMessage(null);
        try {
            await allocationService.completeAllocation(emergencyId, { cancel });
            setActionMessage({ type: 'success', text: cancel ? 'Emergency cancelled. Resources released.' : 'Emergency completed. Resources released.' });
            await fetchCaseData();
        } catch (err) {
            setActionMessage({ type: 'error', text: err.message || 'Failed to update emergency' });
        } finally {
            setActionLoading(false);
        }
    };

    const getStatusColor = (status) => {
        const map = {
            'WAITING FOR CONFIRMATION': 'bg-warning/20 text-warning border-warning/30',
            'HOSPITAL ACCEPTED': 'bg-success/20 text-success border-success/30',
            'HOSPITAL REJECTED': 'bg-error/20 text-error border-error/30',
            'AMBULANCE DISPATCHED': 'bg-info/20 text-info border-info/30',
            'AMBULANCE EN ROUTE': 'bg-info/20 text-info border-info/30',
            'ARRIVED AT HOSPITAL': 'bg-success/20 text-success border-success/30',
            'ADMITTED': 'bg-success/20 text-success border-success/30',
            'COMPLETED': 'bg-success/20 text-success border-success/30',
            'CANCELLED': 'bg-error/20 text-error border-error/30',
            'HOSPITAL SEARCH': 'bg-warning/20 text-warning border-warning/30',
            'REQUESTED': 'bg-warning/20 text-warning border-warning/30',
        };
        return map[status] || 'bg-secondary/20 text-secondary border-secondary/30';
    };

    const getResourceStatusColor = (status) => {
        const map = {
            'PENDING': 'bg-warning/20 text-warning',
            'RESERVED': 'bg-success/20 text-success',
            'RELEASED': 'bg-secondary/20 text-secondary',
            'COMPLETED': 'bg-success/20 text-success',
            'FAILED': 'bg-error/20 text-error',
        };
        return map[status] || 'bg-secondary/20 text-secondary';
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <LoadingSpinner size="lg" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center p-8">
                <div className="max-w-md w-full">
                    <Alert variant="error">{error}</Alert>
                    <button onClick={() => navigate(-1)} className="btn-outline mt-4 w-full">Go Back</button>
                </div>
            </div>
        );
    }

    if (!caseData) return null;

    const hospital = caseData.assignedHospital;
    const ambulance = caseData.assignedAmbulance;
    const resourceAlloc = caseData.resourceAllocation || {};
    const timeline = caseData.timeline || [];

    return (
        <DashboardLayout
            title={`Emergency Case ${caseData.emergencyId || ''}`}
            subtitle="Dynamic resource allocation - complete case view"
            breadcrumbs={[
                { label: isAdmin ? 'Admin Dashboard' : 'User Portal', href: isAdmin ? '/admin/dashboard' : '/emergency' },
                { label: 'Emergency Case' },
            ]}
            actions={
                <div className="flex items-center gap-3">
                    <span className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold border ${getStatusColor(caseData.caseStatus)}`}>
                        <span className="h-2 w-2 rounded-full bg-current animate-pulse" />
                        {caseData.caseStatus}
                    </span>
                </div>
            }
        >
            <div className="space-y-8">
                {actionMessage && (
                    <Alert variant={actionMessage.type === 'success' ? 'success' : 'error'} dismissible onDismiss={() => setActionMessage(null)}>
                        {actionMessage.text}
                    </Alert>
                )}

                {/* Status Overview Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <div className="bg-surface rounded-3xl shadow-soft p-6 border border-border/50">
                        <div className="flex items-center justify-between mb-3">
                            <p className="text-sm text-text-secondary">Patient</p>
                            <span className="text-2xl">👤</span>
                        </div>
                        <p className="text-lg font-bold text-text-primary">{caseData.patient?.name || 'Unknown'}</p>
                        <p className="text-sm text-text-secondary mt-1">
                            {caseData.patient?.age || 'N/A'} yrs • {caseData.patient?.gender || 'N/A'} • {caseData.patient?.bloodGroup || 'N/A'}
                        </p>
                    </div>

                    <div className="bg-surface rounded-3xl shadow-soft p-6 border border-border/50">
                        <div className="flex items-center justify-between mb-3">
                            <p className="text-sm text-text-secondary">Required Resources</p>
                            <span className="text-2xl">🏥</span>
                        </div>
                        <p className="text-lg font-bold text-text-primary">{caseData.requiredResource?.bedType || 'Emergency'} Bed</p>
                        <p className="text-sm text-text-secondary mt-1">
                            {caseData.requiredResource?.specialist || 'Emergency physician'}
                            {caseData.requiredResource?.equipment ? ` • ${caseData.requiredResource.equipment}` : ''}
                        </p>
                    </div>

                    <div className="bg-surface rounded-3xl shadow-soft p-6 border border-border/50">
                        <div className="flex items-center justify-between mb-3">
                            <p className="text-sm text-text-secondary">Resource Lock</p>
                            <span className="text-2xl">🔒</span>
                        </div>
                        <span className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-sm font-semibold ${getResourceStatusColor(resourceAlloc.status)}`}>
                            {resourceAlloc.status || 'PENDING'}
                        </span>
                        {resourceAlloc.reservations?.length > 0 && (
                            <p className="text-xs text-text-secondary mt-2">
                                {resourceAlloc.reservations.map(r => `${r.type} (${r.status})`).join(', ')}
                            </p>
                        )}
                    </div>

                    <div className="bg-surface rounded-3xl shadow-soft p-6 border border-border/50">
                        <div className="flex items-center justify-between mb-3">
                            <p className="text-sm text-text-secondary">Severity</p>
                            <span className="text-2xl">⚠️</span>
                        </div>
                        <p className="text-lg font-bold text-text-primary">{caseData.severity}/10</p>
                        <p className="text-sm text-text-secondary mt-1">Priority: {caseData.priority || 'medium'}</p>
                    </div>

                    <div className="bg-surface rounded-3xl shadow-soft p-6 border border-border/50 md:col-span-2 lg:col-span-4">
                        <div className="flex flex-wrap items-center justify-between gap-3">
                            <div>
                                <p className="text-sm text-text-secondary">AI allocation decision</p>
                                <p className="text-lg font-bold text-text-primary">{caseData.aiAllocation?.decision || 'PENDING'} · {Math.round((caseData.aiAllocation?.confidence || 0) * 100)}% confidence</p>
                            </div>
                            <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">{caseData.aiAllocation?.provider || 'local-resource-ai'}</span>
                        </div>
                        <p className="mt-2 text-sm text-text-secondary">{caseData.aiAllocation?.reasoning?.join(' ') || 'The allocation engine is evaluating live resources.'}</p>
                    </div>
                </div>

                {/* Main Content Tabs */}
                <div className="space-y-6">
                    <div className="flex flex-wrap gap-3">
                        <button
                            onClick={() => setActiveTab('overview')}
                            className={`px-4 py-2 rounded-2xl font-semibold text-xs transition-all ${activeTab === 'overview' ? 'bg-primary text-white shadow-soft' : 'bg-surface text-text-primary border border-border hover:bg-primary/10'}`}
                        >
                            Overview
                        </button>
                        <button
                            onClick={() => setActiveTab('allocation')}
                            className={`px-4 py-2 rounded-2xl font-semibold text-xs transition-all ${activeTab === 'allocation' ? 'bg-primary text-white shadow-soft' : 'bg-surface text-text-primary border border-border hover:bg-primary/10'}`}
                        >
                            Allocation Details
                        </button>
                        <button
                            onClick={() => setActiveTab('timeline')}
                            className={`px-4 py-2 rounded-2xl font-semibold text-xs transition-all ${activeTab === 'timeline' ? 'bg-primary text-white shadow-soft' : 'bg-surface text-text-primary border border-border hover:bg-primary/10'}`}
                        >
                            Case Timeline
                        </button>
                        <button
                            onClick={() => setActiveTab('handover')}
                            className={`px-4 py-2 rounded-2xl font-semibold text-xs transition-all ${activeTab === 'handover' ? 'bg-primary text-white shadow-soft' : 'bg-surface text-text-primary border border-border hover:bg-primary/10'}`}
                        >
                            Patient Handover
                        </button>
                    </div>

                    {activeTab === 'overview' && (
                        <div className="grid gap-6 lg:grid-cols-2">
                            {/* Hospital Assignment */}
                            <div className="bg-surface rounded-3xl shadow-soft p-6 border border-border/40">
                                <h2 className="text-lg font-semibold text-text-primary mb-4">Hospital Assignment</h2>
                                {hospital ? (
                                    <div className="space-y-4">
                                        <div className="flex items-start gap-4 p-4 bg-background/50 rounded-2xl border border-border/50">
                                            <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-2xl">🏥</div>
                                            <div className="flex-1">
                                                <p className="font-semibold text-text-primary">{hospital.name}</p>
                                                <p className="text-sm text-text-secondary">{hospital.area || 'Mangalore'}</p>
                                                <div className="flex flex-wrap gap-2 mt-2">
                                                    <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded font-mono">{hospital.code}</span>
                                                    <span className="text-xs bg-secondary/10 text-secondary px-2 py-0.5 rounded">{hospital.hospitalType}</span>
                                                </div>
                                            </div>
                                        </div>

                                        {isAdmin && caseData.caseStatus === 'WAITING FOR CONFIRMATION' && (
                                            <div className="flex gap-3">
                                                <button
                                                    onClick={handleConfirm}
                                                    disabled={actionLoading}
                                                    className="flex-1 bg-success text-white px-4 py-2.5 rounded-xl font-semibold text-sm hover:bg-success/90 transition-all disabled:opacity-50"
                                                >
                                                    {actionLoading ? 'Processing...' : '✓ Confirm & Lock Resources'}
                                                </button>
                                                <button
                                                    onClick={handleReject}
                                                    disabled={actionLoading}
                                                    className="flex-1 bg-error text-white px-4 py-2.5 rounded-xl font-semibold text-sm hover:bg-error/90 transition-all disabled:opacity-50"
                                                >
                                                    {actionLoading ? 'Processing...' : '✗ Reject & Reallocate'}
                                                </button>
                                            </div>
                                        )}

                                        {isAdmin && (caseData.caseStatus === 'HOSPITAL ACCEPTED' || caseData.caseStatus === 'AMBULANCE DISPATCHED' || caseData.caseStatus === 'AMBULANCE EN ROUTE') && (
                                            <div className="flex gap-3">
                                                <button
                                                    onClick={() => handleComplete(true)}
                                                    disabled={actionLoading}
                                                    className="flex-1 bg-error/10 text-error border border-error/30 px-4 py-2.5 rounded-xl font-semibold text-sm hover:bg-error/20 transition-all disabled:opacity-50"
                                                >
                                                    Cancel Emergency
                                                </button>
                                                <button
                                                    onClick={() => handleComplete(false)}
                                                    disabled={actionLoading}
                                                    className="flex-1 bg-success/10 text-success border border-success/30 px-4 py-2.5 rounded-xl font-semibold text-sm hover:bg-success/20 transition-all disabled:opacity-50"
                                                >
                                                    Mark Completed
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <p className="text-text-secondary text-center py-8">No hospital assigned yet</p>
                                )}
                            </div>

                            {/* Ambulance Assignment */}
                            <div className="bg-surface rounded-3xl shadow-soft p-6 border border-border/40">
                                <h2 className="text-lg font-semibold text-text-primary mb-4">Ambulance Assignment</h2>
                                {ambulance ? (
                                    <div className="space-y-4">
                                        <div className="flex items-start gap-4 p-4 bg-background/50 rounded-2xl border border-border/50">
                                            <div className="w-12 h-12 rounded-2xl bg-success/10 flex items-center justify-center text-2xl">🚑</div>
                                            <div className="flex-1">
                                                <p className="font-semibold text-text-primary">{ambulance.vehicleNumber || 'KA-19-AB-1234'}</p>
                                                <p className="text-sm text-text-secondary">{ambulance.vehicleType || 'BLS'} Ambulance</p>
                                                {ambulance.crew?.driver && (
                                                    <p className="text-xs text-text-secondary mt-1">Driver: {ambulance.crew.driver.name}</p>
                                                )}
                                                <div className="flex flex-wrap gap-2 mt-2">
                                                    <span className="text-xs bg-success/10 text-success px-2 py-0.5 rounded">Status: {ambulance.status || 'available'}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="text-center py-8">
                                        <p className="text-3xl mb-2">🚑</p>
                                        <p className="text-text-secondary">Ambulance will be assigned after hospital confirmation</p>
                                    </div>
                                )}

                                {/* Patient Handover Preview */}
                                {caseData.patientHandover?.shared && (
                                    <div className="mt-4 p-4 bg-success/5 rounded-2xl border border-success/20">
                                        <p className="text-sm font-semibold text-success mb-2">✓ Patient Information Shared</p>
                                        <div className="grid grid-cols-3 gap-3 text-center">
                                            <div>
                                                <p className="text-xs text-text-secondary">Heart Rate</p>
                                                <p className="font-bold text-text-primary">{caseData.patientHandover.vitals?.heartRate || '--'} bpm</p>
                                            </div>
                                            <div>
                                                <p className="text-xs text-text-secondary">SpO₂</p>
                                                <p className="font-bold text-text-primary">{caseData.patientHandover.vitals?.spo2 || '--'}%</p>
                                            </div>
                                            <div>
                                                <p className="text-xs text-text-secondary">ETA</p>
                                                <p className="font-bold text-text-primary">{caseData.patientHandover.eta || '--'} min</p>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {activeTab === 'allocation' && (
                        <div className="bg-surface rounded-3xl shadow-soft p-6 border border-border/40">
                            <h2 className="text-lg font-semibold text-text-primary mb-4">Allocation History</h2>
                            <div className="space-y-4">
                                {allocationHistory.length > 0 ? (
                                    allocationHistory.map((alloc, idx) => (
                                        <div key={idx} className="p-4 bg-background/50 rounded-2xl border border-border/50">
                                            <div className="flex items-center justify-between mb-2">
                                                <p className="font-semibold text-text-primary">{alloc.recommendedHospital?.name || 'Unknown Hospital'}</p>
                                                <span className={`text-xs font-bold px-2 py-1 rounded-full ${alloc.hospitalResponse === 'ACCEPTED' ? 'bg-success/20 text-success' :
                                                    alloc.hospitalResponse === 'REJECTED' ? 'bg-error/20 text-error' :
                                                        'bg-warning/20 text-warning'
                                                    }`}>
                                                    {alloc.hospitalResponse}
                                                </span>
                                            </div>
                                            <p className="text-sm text-text-secondary mb-2">{alloc.reason}</p>
                                            <div className="flex flex-wrap gap-2 text-xs">
                                                <span className="bg-primary/10 text-primary px-2 py-0.5 rounded">Score: {alloc.recommendedHospital?.score || 'N/A'}</span>
                                                <span className="bg-secondary/10 text-secondary px-2 py-0.5 rounded">ETA: {alloc.travelTime} min</span>
                                                <span className="bg-secondary/10 text-secondary px-2 py-0.5 rounded">Status: {alloc.status}</span>
                                            </div>
                                            {alloc.rejectionReason && (
                                                <p className="text-xs text-error mt-2">Rejection: {alloc.rejectionReason}</p>
                                            )}
                                        </div>
                                    ))
                                ) : (
                                    <p className="text-text-secondary text-center py-8">No allocation history yet</p>
                                )}
                            </div>
                        </div>
                    )}

                    {activeTab === 'timeline' && (
                        <div className="bg-surface rounded-3xl shadow-soft p-6 border border-border/40">
                            <h2 className="text-lg font-semibold text-text-primary mb-4">Case Timeline</h2>
                            <div className="space-y-4">
                                {timeline.length > 0 ? (
                                    timeline.map((event, idx) => (
                                        <div key={idx} className="flex gap-4">
                                            <div className="flex flex-col items-center">
                                                <div className={`w-3 h-3 rounded-full mt-1.5 ${event.actor === 'HOSPITAL' ? 'bg-primary' :
                                                    event.actor === 'SYSTEM' ? 'bg-info' :
                                                        event.actor === 'AMBULANCE' ? 'bg-success' : 'bg-warning'
                                                    }`} />
                                                {idx < timeline.length - 1 && <div className="w-px flex-1 bg-border" />}
                                            </div>
                                            <div className="flex-1 pb-4">
                                                <div className="flex items-center justify-between">
                                                    <p className="font-semibold text-text-primary text-sm">{event.event}</p>
                                                    <span className="text-xs text-text-tertiary">
                                                        {new Date(event.timestamp).toLocaleTimeString()}
                                                    </span>
                                                </div>
                                                <p className="text-sm text-text-secondary mt-1">{event.description}</p>
                                                <span className="text-xs text-text-tertiary mt-1 inline-block">Actor: {event.actor}</span>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <p className="text-text-secondary text-center py-8">No timeline events yet</p>
                                )}
                            </div>
                        </div>
                    )}

                    {activeTab === 'handover' && (
                        <div className="bg-surface rounded-3xl shadow-soft p-6 border border-border/40">
                            <h2 className="text-lg font-semibold text-text-primary mb-4">Patient Handover Data</h2>
                            {caseData.patientHandover?.shared ? (
                                <div className="space-y-6">
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                        <div className="p-4 bg-background/50 rounded-2xl border border-border/50 text-center">
                                            <p className="text-xs text-text-secondary mb-1">Heart Rate</p>
                                            <p className="text-2xl font-bold text-text-primary">{caseData.patientHandover.vitals?.heartRate || '--'}</p>
                                            <p className="text-xs text-text-tertiary">bpm</p>
                                        </div>
                                        <div className="p-4 bg-background/50 rounded-2xl border border-border/50 text-center">
                                            <p className="text-xs text-text-secondary mb-1">SpO₂</p>
                                            <p className="text-2xl font-bold text-text-primary">{caseData.patientHandover.vitals?.spo2 || '--'}</p>
                                            <p className="text-xs text-text-tertiary">%</p>
                                        </div>
                                        <div className="p-4 bg-background/50 rounded-2xl border border-border/50 text-center">
                                            <p className="text-xs text-text-secondary mb-1">Temperature</p>
                                            <p className="text-2xl font-bold text-text-primary">{caseData.patientHandover.vitals?.temperature || '--'}</p>
                                            <p className="text-xs text-text-tertiary">°F</p>
                                        </div>
                                        <div className="p-4 bg-background/50 rounded-2xl border border-border/50 text-center">
                                            <p className="text-xs text-text-secondary mb-1">ETA</p>
                                            <p className="text-2xl font-bold text-text-primary">{caseData.patientHandover.eta || '--'}</p>
                                            <p className="text-xs text-text-tertiary">minutes</p>
                                        </div>
                                    </div>

                                    <div className="p-4 bg-background/50 rounded-2xl border border-border/50">
                                        <p className="text-sm font-semibold text-text-primary mb-2">Ambulance Location</p>
                                        <p className="text-sm text-text-secondary">
                                            Lat: {caseData.patientHandover.ambulanceLocation?.latitude || '--'} •
                                            Lng: {caseData.patientHandover.ambulanceLocation?.longitude || '--'}
                                        </p>
                                    </div>

                                    <div className="p-4 bg-success/5 rounded-2xl border border-success/20">
                                        <p className="text-sm font-semibold text-success">✓ Shared with hospital at {new Date(caseData.patientHandover.sharedAt).toLocaleString()}</p>
                                        <p className="text-xs text-text-secondary mt-1">
                                            This data will be updated in real-time from IoT devices (ESP32) and GPS tracking in production.
                                        </p>
                                    </div>
                                </div>
                            ) : (
                                <div className="text-center py-8">
                                    <p className="text-3xl mb-2">📋</p>
                                    <p className="text-text-secondary">Patient handover data will be shared after hospital confirmation</p>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </DashboardLayout>
    );
};

export default EmergencyCaseDashboard;