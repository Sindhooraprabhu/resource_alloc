const Emergency = require('../models/Emergency');
const Hospital = require('../models/Hospital');
const AllocationHistory = require('../models/AllocationHistory');
const Ambulance = require('../models/Ambulance');
const allocationEngine = require('../services/allocationEngine');
const notificationService = require('../services/notificationService');

/**
 * ─────────────────────────────────────────────────────────────
 * DYNAMIC EMERGENCY RESOURCE ALLOCATION CONTROLLER
 * ─────────────────────────────────────────────────────────────
 * Exposes the allocation engine through REST API endpoints.
 * 
 * These endpoints are designed to be AI-agent-ready:
 * The real AI voice calling agent can call the same endpoints
 * with the same structured data without rebuilding anything.
 */

// @desc    Trigger allocation for an emergency case
// @route   POST /api/allocation/:emergencyId/allocate
// @access  Private
const allocateEmergency = async (req, res, next) => {
    try {
        const { emergencyId } = req.params;

        const result = await allocationEngine.allocateEmergencyResources(emergencyId);

        // Add timeline event
        const emergency = await Emergency.findById(emergencyId);
        if (emergency) {
            emergency.timeline.push({
                event: 'ALLOCATION_TRIGGERED',
                description: result.success
                    ? `Allocation engine evaluated hospitals and recommended ${result.recommendedHospital?.name}. Resources reserved, awaiting admin confirmation.`
                    : result.message,
                actor: 'SYSTEM',
                metadata: {
                    requirements: result.requirements,
                    recommendedHospital: result.recommendedHospital?.hospital,
                    explanation: result.explanation
                }
            });
            await emergency.save();
        }

        // Broadcast via Socket.IO
        const io = req.app.get('io');
        if (io && result.success) {
            io.to(`emergency_${emergencyId}`).emit('allocationUpdated', result);
            io.emit('allocationUpdated', {
                emergencyId,
                caseStatus: result.caseStatus,
                recommendedHospital: result.recommendedHospital,
                explanation: result.explanation
            });
            io.to(`hospital_${result.recommendedHospital?.hospital}`).emit('incomingEmergency', {
                emergencyId,
                patient: emergency?.patient,
                severity: emergency?.severity,
                symptoms: emergency?.symptoms,
                requiredResource: result.requirements,
                eta: `${result.recommendedHospital?.travelTime} min`,
                explanation: result.explanation,
                reservations: result.reservations,
                ambulance: result.ambulance,
                doctor: result.doctor
            });
        }

        res.status(200).json(result);
    } catch (error) {
        next(error);
    }
};

// @desc    Get allocation status for an emergency
// @route   GET /api/allocation/:emergencyId/status
// @access  Private
const getAllocationStatus = async (req, res, next) => {
    try {
        const { emergencyId } = req.params;

        const emergency = await Emergency.findById(emergencyId)
            .populate('assignedHospital', 'name code area')
            .populate('assignedAmbulance', 'vehicleNumber vehicleType currentLocation status crew')
            .populate('assignedAmbulance.crew.driver', 'name phone')
            .populate('assignedDoctor', 'name doctorInfo')
            .populate('resourceAllocation.hospital', 'name code area')
            .populate('allocationAttempts.hospital', 'name code area');

        if (!emergency) {
            res.status(404);
            return next(new Error('Emergency case not found'));
        }

        const allocationHistory = await AllocationHistory.find({ caseId: emergencyId })
            .populate('recommendedHospital', 'name code area')
            .populate('alternativeHospitals.hospital', 'name code area')
            .sort({ createdAt: -1 });

        res.status(200).json({
            emergency: {
                _id: emergency._id,
                emergencyId: emergency.emergencyId,
                type: emergency.type,
                subtype: emergency.subtype,
                caseStatus: emergency.caseStatus,
                status: emergency.status,
                priority: emergency.priority,
                severity: emergency.severity,
                address: emergency.address,
                location: emergency.location,
                symptoms: emergency.symptoms,
                requiredResource: emergency.requiredResource,
                resourceAllocation: emergency.resourceAllocation,
                allocationAttempts: emergency.allocationAttempts,
                assignedHospital: emergency.assignedHospital,
                assignedAmbulance: emergency.assignedAmbulance,
                assignedDoctor: emergency.assignedDoctor,
                routePlan: emergency.routePlan,
                aiAllocation: emergency.aiAllocation,
                patient: emergency.patient,
                timeline: emergency.timeline,
                patientHandover: emergency.patientHandover
            },
            allocationHistory
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Confirm hospital acceptance and finalize allocation (Admin confirmation)
// @route   POST /api/allocation/:emergencyId/confirm
// @access  Private
const confirmAllocation = async (req, res, next) => {
    try {
        const { emergencyId } = req.params;
        const { hospitalId, vitals, ambulanceLocation, eta, doctorId, requirements } = req.body;

        const result = await allocationEngine.confirmHospitalAcceptance(emergencyId, hospitalId, { doctorId, requirements, manualOverride: req.user?.role === 'admin' });

        // Use the emergency from result (already updated with patientHandover)
        const emergency = result.emergency;

        // Send notifications via notification service
        if (emergency) {
            const hospitalId = emergency.assignedHospital?._id || emergency.assignedHospital;
            await Promise.all([
                notificationService.notifyPatient(emergency, {
                    message: `Hospital confirmed: ${emergency.assignedHospital?.name}. Ambulance dispatched. ETA: ${emergency.patientHandover?.eta} min`,
                    type: 'HOSPITAL_CONFIRMED'
                }),
                emergency.assignedAmbulance && notificationService.notifyAmbulance(emergency.assignedAmbulance, {
                    message: `New dispatch: ${emergency.assignedHospital?.name}. Patient: ${emergency.patient?.name}`,
                    data: { emergencyId, hospital: hospitalId }
                }),
                emergency.assignedHospital && notificationService.notifyHospital(emergency.assignedHospital, {
                    message: `Emergency accepted. Resources reserved for ${emergency.patient?.name}`,
                    data: { emergencyId, patient: emergency.patient }
                })
            ]);
        }

        // Broadcast via Socket.IO
        const io = req.app.get('io');
        if (io) {
            io.to(`emergency_${emergencyId}`).emit('emergencyUpdated', {
                emergencyId,
                status: emergency?.status,
                caseStatus: emergency?.caseStatus,
                resourceAllocation: emergency?.resourceAllocation
            });
            io.emit('emergencyUpdated', {
                emergencyId,
                status: emergency?.status,
                caseStatus: emergency?.caseStatus,
                assignedHospital: emergency?.assignedHospital,
                resourceAllocation: emergency?.resourceAllocation
            });
            io.to(`hospital_${hospitalId || emergency?.assignedHospital?._id}`).emit('requestStatusChanged', {
                emergencyId,
                caseStatus: 'HOSPITAL ACCEPTED',
                reservations: result.reservations
            });
            if (result.ambulance) {
                io.to(`ambulance_${result.ambulance._id}`).emit('ambulanceDispatched', {
                    emergencyId,
                    hospital: emergency?.assignedHospital,
                    patient: emergency?.patient,
                    eta: emergency?.patientHandover?.eta
                });
            }
        }

        res.status(200).json(result);
    } catch (error) {
        next(error);
    }
};

// @desc    Admin override of AI recommendation and complete allocation
// @route   POST /api/allocation/:emergencyId/manual
// @access  Private/Admin
const manualAllocation = async (req, res, next) => {
    try {
        const { emergencyId } = req.params;
        const { hospitalId, doctorId, requirements } = req.body;
        if (!hospitalId) {
            res.status(400);
            return next(new Error('hospitalId is required for manual allocation'));
        }

        const emergency = await Emergency.findById(emergencyId);
        if (!emergency) {
            res.status(404);
            return next(new Error('Emergency case not found'));
        }

        emergency.assignedHospital = hospitalId;
        if (requirements) emergency.requiredResource = requirements;
        emergency.timeline.push({
            event: 'ADMIN_OVERRIDE',
            description: 'Admin manually overrode the AI hospital/resource recommendation',
            actor: 'ADMIN',
            metadata: { hospitalId, doctorId, requirements }
        });
        await emergency.save();

        const result = await allocationEngine.confirmHospitalAcceptance(
            emergencyId,
            hospitalId,
            { doctorId, requirements, manualOverride: true }
        );
        res.status(200).json({ ...result, manualOverride: true });
    } catch (error) {
        next(error);
    }
};

const refreshRouting = async (req, res, next) => {
    try {
        const { emergencyId } = req.params;
        const result = await allocationEngine.refreshEmergencyRouting(
            emergencyId,
            req.body.traffic || 'light'
        );
        const io = req.app.get('io');
        if (io) {
            io.to(`emergency_${emergencyId}`).emit('routingUpdated', result);
            io.emit('allocationUpdated', {
                emergencyId,
                changedHospital: result.changedHospital,
                recommendedHospital: result.recommendedHospital,
                message: result.message
            });
        }
        res.status(200).json(result);
    } catch (error) {
        next(error);
    }
};

const notifyPatient = async (req, res, next) => {
    try {
        const { emergencyId } = req.params;
        const { message, type = 'UPDATE' } = req.body;
        if (!message) {
            res.status(400);
            return next(new Error('message is required'));
        }
        const emergency = await Emergency.findById(emergencyId);
        if (!emergency) {
            res.status(404);
            return next(new Error('Emergency case not found'));
        }
        const notification = {
            event: 'PATIENT_NOTIFICATION',
            description: message,
            actor: 'ADMIN',
            metadata: { type, sentAt: new Date() }
        };
        emergency.timeline.push(notification);
        await emergency.save();

        // Send push/email/SMS via notification service
        await notificationService.notifyPatient(emergency, { message, type });

        // Also emit via Socket.IO for real-time if connected
        const io = req.app.get('io');
        if (io) io.to(`emergency_${emergencyId}`).emit('patientNotification', notification);
        res.status(200).json({ success: true, notification });
    } catch (error) {
        next(error);
    }
};

// @desc    Reject hospital allocation and reallocate
// @route   POST /api/allocation/:emergencyId/reject
// @access  Private
const rejectAllocation = async (req, res, next) => {
    try {
        const { emergencyId } = req.params;
        const { hospitalId, rejectionReason } = req.body;

        const result = await allocationEngine.rejectHospitalAllocation(emergencyId, hospitalId, rejectionReason);

        // Add timeline event
        const emergency = await Emergency.findById(emergencyId);
        if (emergency) {
            emergency.timeline.push({
                event: 'HOSPITAL_REJECTED',
                description: `Hospital rejected the emergency. Reason: ${rejectionReason || 'Not specified'}`,
                actor: 'HOSPITAL',
                metadata: { hospital: hospitalId, rejectionReason }
            });

            if (result.success) {
                emergency.timeline.push({
                    event: 'REALLOCATION_TRIGGERED',
                    description: `Allocation engine reallocated to ${result.recommendedHospital?.name}`,
                    actor: 'SYSTEM',
                    metadata: {
                        newHospital: result.recommendedHospital?.hospital,
                        explanation: result.explanation
                    }
                });
            }

            await emergency.save();
        }

        // Broadcast via Socket.IO
        const io = req.app.get('io');
        if (io) {
            io.to(`emergency_${emergencyId}`).emit('allocationUpdated', {
                emergencyId,
                caseStatus: result.caseStatus,
                recommendedHospital: result.recommendedHospital,
                explanation: result.explanation,
                reallocated: result.success
            });
            io.emit('allocationUpdated', {
                emergencyId,
                caseStatus: result.caseStatus,
                recommendedHospital: result.recommendedHospital,
                explanation: result.explanation,
                reallocated: result.success
            });
            if (result.success) {
                io.to(`hospital_${result.recommendedHospital?.hospital}`).emit('incomingEmergency', {
                    emergencyId,
                    patient: emergency?.patient,
                    severity: emergency?.severity,
                    symptoms: emergency?.symptoms,
                    requiredResource: result.requirements,
                    eta: `${result.recommendedHospital?.travelTime} min`,
                    explanation: result.explanation
                });
            }
        }

        res.status(200).json(result);
    } catch (error) {
        next(error);
    }
};

// @desc    Complete or cancel emergency and release resources
// @route   POST /api/allocation/:emergencyId/complete
// @access  Private
const completeAllocation = async (req, res, next) => {
    try {
        const { emergencyId } = req.params;
        const { cancel = false } = req.body;

        const result = await allocationEngine.completeEmergencyResources(emergencyId, cancel);

        // Add timeline event
        const emergency = await Emergency.findById(emergencyId);
        if (emergency) {
            emergency.timeline.push({
                event: cancel ? 'EMERGENCY_CANCELLED' : 'EMERGENCY_COMPLETED',
                description: cancel
                    ? 'Emergency cancelled. Reserved resources released.'
                    : 'Emergency completed. Resources released.',
                actor: 'SYSTEM'
            });
            await emergency.save();
        }

        // Broadcast via Socket.IO
        const io = req.app.get('io');
        if (io) {
            io.emit('emergencyUpdated', {
                emergencyId,
                status: result.emergency?.status,
                caseStatus: result.emergency?.caseStatus,
                resourceAllocation: result.emergency?.resourceAllocation
            });
        }

        res.status(200).json(result);
    } catch (error) {
        next(error);
    }
};

// @desc    Get all active allocations (for admin dashboard)
// @route   GET /api/allocation/active
// @access  Private/Admin
const getActiveAllocations = async (req, res, next) => {
    try {
        const emergencies = await Emergency.find({
            status: { $nin: ['completed', 'cancelled'] }
        })
            .populate('assignedHospital', 'name code area')
            .populate('assignedAmbulance', 'vehicleNumber vehicleType currentLocation status crew')
            .populate('assignedAmbulance.crew.driver', 'name phone')
            .populate('assignedDoctor', 'name doctorInfo')
            .populate('resourceAllocation.hospital', 'name code area')
            .sort({ reportedAt: -1 });

        res.status(200).json(emergencies);
    } catch (error) {
        next(error);
    }
};

// @desc    Update patient handover data (vitals, ambulance location, ETA)
// @route   PUT /api/allocation/:emergencyId/handover
// @access  Private
const updatePatientHandover = async (req, res, next) => {
    try {
        const { emergencyId } = req.params;
        const { vitals, ambulanceLocation, eta } = req.body;

        const emergency = await Emergency.findById(emergencyId);
        if (!emergency) {
            res.status(404);
            return next(new Error('Emergency case not found'));
        }

        emergency.patientHandover = {
            shared: true,
            sharedAt: emergency.patientHandover?.sharedAt || new Date(),
            vitals: vitals || emergency.patientHandover?.vitals || {},
            ambulanceLocation: ambulanceLocation || emergency.patientHandover?.ambulanceLocation || {},
            eta: eta || emergency.patientHandover?.eta || 0
        };

        emergency.timeline.push({
            event: 'HANDOVER_UPDATED',
            description: 'Patient handover data updated (vitals/location/ETA)',
            actor: 'SYSTEM',
            metadata: emergency.patientHandover
        });

        await emergency.save();

        // Broadcast via Socket.IO
        const io = req.app.get('io');
        if (io) {
            io.emit('handoverUpdated', {
                emergencyId,
                patientHandover: emergency.patientHandover
            });
        }

        res.status(200).json(emergency.patientHandover);
    } catch (error) {
        next(error);
    }
};

module.exports = {
    allocateEmergency,
    getAllocationStatus,
    confirmAllocation,
    manualAllocation,
    refreshRouting,
    notifyPatient,
    rejectAllocation,
    completeAllocation,
    getActiveAllocations,
    updatePatientHandover
};