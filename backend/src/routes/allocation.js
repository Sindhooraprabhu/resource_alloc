const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/authMiddleware');
const allocationController = require('../controllers/allocationController');

// Anonymous emergency reporters need to follow and confirm their own case.
router.get('/:emergencyId/status', allocationController.getAllocationStatus);

// All allocation routes are protected
router.use(protect);

// Active allocations (admin view)
router.get('/active', authorize('admin'), allocationController.getActiveAllocations);

// Allocation workflow
router.post('/:emergencyId/allocate', allocationController.allocateEmergency);
router.post('/:emergencyId/confirm', authorize('admin', 'hospital'), allocationController.confirmAllocation);
router.post('/:emergencyId/manual', authorize('admin'), allocationController.manualAllocation);
router.post('/:emergencyId/refresh-route', authorize('admin'), allocationController.refreshRouting);
router.post('/:emergencyId/notify-patient', authorize('admin'), allocationController.notifyPatient);
router.post('/:emergencyId/reject', allocationController.rejectAllocation);
router.post('/:emergencyId/complete', allocationController.completeAllocation);
router.put('/:emergencyId/handover', allocationController.updatePatientHandover);

module.exports = router;