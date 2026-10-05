import React, { useState, useEffect, useCallback } from 'react';
import allocationService from '../../services/allocationService';
import { Card, Badge, Button, LoadingSpinner, Alert, Modal } from '../ui';

const AdminAllocationConfirmWidget = () => {
    const [pendingCases, setPendingCases] = useState([]);
    const [loading, setLoading] = useState(false);
    const [selectedCase, setSelectedCase] = useState(null);
    const [confirmLoading, setConfirmLoading] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);

    const fetchPendingCases = useCallback(async () => {
        try {
            setLoading(true);
            const allocations = await allocationService.getActiveAllocations();
            const waiting = (allocations || []).filter(e =>
                e.caseStatus === 'WAITING FOR CONFIRMATION' ||
                e.caseStatus === 'REQUESTED' ||
                e.caseStatus === 'HOSPITAL SEARCH'
            );
            setPendingCases(waiting);
        } catch (err) {
            console.error('Failed to fetch pending cases:', err);
            setError('Failed to load pending cases');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchPendingCases();
    }, [fetchPendingCases]);

    const handleConfirm = async (emergencyId, hospitalId) => {
        setConfirmLoading(true);
        setError(null);
        setSuccess(null);

        try {
            const result = await allocationService.confirmAllocation(emergencyId, {
                hospitalId,
                requirements: pendingCases.find(c => c._id === emergencyId)?.requiredResource
            });
            setSuccess(`Emergency ${emergencyId} confirmed and resources locked!`);
            fetchPendingCases();
            setSelectedCase(null);
        } catch (err) {
            setError(err.message || 'Failed to confirm allocation');
        } finally {
            setConfirmLoading(false);
        }
    };

    const handleReject = async (emergencyId, hospitalId) => {
        const reason = prompt('Enter rejection reason:');
        if (!reason) return;

        setConfirmLoading(true);
        setError(null);

        try {
            await allocationService.rejectAllocation(emergencyId, { hospitalId, rejectionReason: reason });
            setSuccess(`Emergency ${emergencyId} rejected. Reallocating to next best hospital...`);
            fetchPendingCases();
            setSelectedCase(null);
        } catch (err) {
            setError(err.message || 'Failed to reject allocation');
        } finally {
            setConfirmLoading(false);
        }
    };

    const handleManualOverride = async (emergencyId) => {
        const hospitalId = prompt('Enter Hospital ID for manual override:');
        if (!hospitalId) return;

        setConfirmLoading(true);
        setError(null);

        try {
            await allocationService.manualAllocation(emergencyId, { hospitalId });
            setSuccess(`Manual allocation to hospital ${hospitalId} confirmed!`);
            fetchPendingCases();
            setSelectedCase(null);
        } catch (err) {
            setError(err.message || 'Failed to manually allocate');
        } finally {
            setConfirmLoading(false);
        }
    };

    const formatTime = (date) => {
        return new Date(date).toLocaleTimeString();
    };

    const getSeverityColor = (severity) => {
        if (severity >= 8) return 'text-error';
        if (severity >= 6) return 'text-warning';
        return 'text-success';
    };

    return (
        <div className="bg-surface rounded-3xl shadow-soft p-6 border border-border/40">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h2 className="text-lg font-semibold text-text-primary">⚡ Admin Allocation Confirmation</h2>
                    <p className="text-sm text-text-secondary mt-1">
                        Review AI recommendations and confirm hospital assignments
                    </p>
                </div>
                <Button variant="outline" size="sm" onClick={fetchPendingCases} loading={loading}>
                    Refresh
                </Button>
            </div>

            {error && (
                <Alert variant="error" dismissible onDismiss={() => setError(null)} className="mb-4">
                    {error}
                </Alert>
            )}

            {success && (
                <Alert variant="success" dismissible onDismiss={() => setSuccess(null)} className="mb-4">
                    {success}
                </Alert>
            )}

            <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2">
                {loading && pendingCases.length === 0 && (
                    <div className="text-center py-8">
                        <LoadingSpinner size="lg" />
                        <p className="text-text-secondary mt-2">Loading pending cases...</p>
                    </div>
                )}

                {!loading && pendingCases.length === 0 && (
                    <div className="text-center py-8">
                        <p className="text-3xl mb-2">✅</p>
                        <p className="text-text-secondary">No cases waiting for confirmation</p>
                    </div>
                )}

                {pendingCases.map((emergency) => (
                    <div
                        key={emergency._id}
                        className="p-4 rounded-2xl border bg-background/50 border-border/50 hover:bg-primary/5 transition-all"
                    >
                        <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-3">
                                <span className="font-mono font-bold text-text-primary">{emergency.emergencyId}</span>
                                <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${
                                    emergency.caseStatus === 'WAITING FOR CONFIRMATION' ? 'bg-warning/20 text-warning' :
                                    emergency.caseStatus === 'REQUESTED' ? 'bg-info/20 text-info' :
                                    'bg-secondary/20 text-secondary'
                                }`}>
                                    {emergency.caseStatus}
                                </span>
                            </div>
                            <span className={`text-xs font-bold ${getSeverityColor(emergency.severity)}`}>
                                Severity: {emergency.severity}/10
                            </span>
                        </div>

                        <div className="grid grid-cols-2 gap-4 mb-3 text-sm">
                            <div>
                                <p className="text-text-secondary">Patient</p>
                                <p className="font-medium text-text-primary">
                                    {emergency.patient?.name || 'Unknown'}
                                    {emergency.patient?.age ? `, ${emergency.patient.age} yrs` : ''}
                                </p>
                            </div>
                            <div>
                                <p className="text-text-secondary">Condition</p>
                                <p className="font-medium text-text-primary">{emergency.type}{emergency.subtype ? ` / ${emergency.subtype}` : ''}</p>
                            </div>
                            <div>
                                <p className="text-text-secondary">Location</p>
                                <p className="font-medium text-text-primary truncate">{emergency.address || 'Unknown'}</p>
                            </div>
                            <div>
                                <p className="text-text-secondary">Required</p>
                                <p className="font-medium text-text-primary">
                                    {emergency.requiredResource?.bedType || 'Emergency'} Bed
                                    {emergency.requiredResource?.specialist ? ` • ${emergency.requiredResource.specialist}` : ''}
                                </p>
                            </div>
                        </div>

                        {emergency.assignedHospital && (
                            <div className="p-3 bg-success/5 rounded-xl border border-success/20 mb-3">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <span className="text-success font-semibold">🏥 AI Recommendation</span>
                                        <Badge variant="success" size="xs">{emergency.assignedHospital.name}</Badge>
                                    </div>
                                    <div className="text-right text-sm">
                                        <p className="text-text-secondary">Distance</p>
                                        <p className="font-medium text-text-primary">{emergency.routePlan?.distanceKm || '?'} km</p>
                                        <p className="text-text-secondary">ETA</p>
                                        <p className="font-medium text-success">{emergency.routePlan?.etaMinutes || '?'} min</p>
                                    </div>
                                </div>
                                <p className="text-xs text-text-secondary mt-1">
                                    {emergency.aiAllocation?.reasoning?.[0] || 'Recommended based on live capacity, distance, and traffic'}
                                </p>
                            </div>
                        )}

                        <div className="flex flex-wrap gap-2">
                            {emergency.assignedHospital && (
                                <>
                                    <Button
                                        variant="success"
                                        size="sm"
                                        onClick={() => handleConfirm(emergency._id, emergency.assignedHospital._id)}
                                        loading={confirmLoading}
                                    >
                                        ✓ Confirm & Lock Resources
                                    </Button>
                                    <Button
                                        variant="error"
                                        size="sm"
                                        onClick={() => handleReject(emergency._id, emergency.assignedHospital._id)}
                                        loading={confirmLoading}
                                    >
                                        ✗ Reject & Reallocate
                                    </Button>
                                </>
                            )}
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleManualOverride(emergency._id)}
                                loading={confirmLoading}
                            >
                                ✎ Manual Override
                            </Button>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setSelectedCase(emergency)}
                            >
                                View Details
                            </Button>
                        </div>
                    </div>
                ))}
            </div>

            {selectedCase && (
                <Modal
                    isOpen={!!selectedCase}
                    onClose={() => setSelectedCase(null)}
                    title={`Case Details: ${selectedCase.emergencyId}`}
                    size="lg"
                >
                    <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div><p className="text-text-secondary">Emergency ID</p><p className="font-mono">{selectedCase.emergencyId}</p></div>
                            <div><p className="text-text-secondary">Status</p><p className="font-medium">{selectedCase.caseStatus}</p></div>
                            <div><p className="text-text-secondary">Type</p><p className="font-medium">{selectedCase.type} / {selectedCase.subtype}</p></div>
                            <div><p className="text-text-secondary">Priority</p><p className="font-medium">{selectedCase.priority}</p></div>
                            <div><p className="text-text-secondary">Patient</p><p className="font-medium">{selectedCase.patient?.name || 'Unknown'}</p></div>
                            <div><p className="text-text-secondary">Age / Gender</p><p className="font-medium">{selectedCase.patient?.age || '?'} / {selectedCase.patient?.gender || '?'}</p></div>
                            <div><p className="text-text-secondary">Severity</p><p className={`font-bold ${getSeverityColor(selectedCase.severity)}`}>{selectedCase.severity}/10</p></div>
                            <div><p className="text-text-secondary">Reported</p><p className="font-medium">{formatTime(selectedCase.reportedAt)}</p></div>
                        </div>

                        <div className="p-3 bg-background/50 rounded-xl">
                            <p className="font-medium text-text-primary mb-2">AI Recommendation Reasoning</p>
                            <div className="space-y-1 text-sm text-text-secondary">
                                {selectedCase.aiAllocation?.reasoning?.map((r, i) => (
                                    <p key={i}>• {r}</p>
                                ))}
                            </div>
                        </div>

                        {selectedCase.routePlan && (
                            <div className="p-3 bg-background/50 rounded-xl">
                                <p className="font-medium text-text-primary mb-2">Route Plan</p>
                                <div className="grid grid-cols-3 gap-4 text-sm">
                                    <div><p className="text-text-secondary">Distance</p><p className="font-medium">{selectedCase.routePlan.distanceKm} km</p></div>
                                    <div><p className="text-text-secondary">ETA</p><p className="font-medium text-success">{selectedCase.routePlan.etaMinutes} min</p></div>
                                    <div><p className="text-text-secondary">Traffic</p><p className="font-medium">{selectedCase.routePlan.traffic}</p></div>
                                </div>
                            </div>
                        )}

                        <div className="flex justify-end gap-2 pt-4 border-t">
                            <Button variant="outline" onClick={() => setSelectedCase(null)}>Close</Button>
                            {selectedCase.assignedHospital && (
                                <Button variant="success" onClick={() => handleConfirm(selectedCase._id, selectedCase.assignedHospital._id)} loading={confirmLoading}>
                                    Confirm Allocation
                                </Button>
                            )}
                        </div>
                    </div>
                </Modal>
            )}
        </div>
    );
};

export default AdminAllocationConfirmWidget;