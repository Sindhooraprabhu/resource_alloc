const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const emergencyController = require('../controllers/emergencyController');

// Public routes for SOS activation
router.post('/sos', emergencyController.activateSOS);
router.post('/:id/push-subscription', emergencyController.savePushSubscription);

// Protected routes
router.use(protect);

router.get('/active', emergencyController.getActiveEmergencies);
router.get('/history', emergencyController.getEmergencyHistory);
router.get('/allocation-history', emergencyController.getAllAllocationHistories);
router.get('/nearby/hospitals', emergencyController.getNearbyHospitals);
router.post('/incident', emergencyController.reportIncident);
router.get('/incidents', emergencyController.getIncidentReports);
router.get('/:id/allocation-history', emergencyController.getAllocationHistory);
router.get('/:id', emergencyController.getEmergencyById);
router.patch('/:id/status', emergencyController.updateEmergencyStatus);

module.exports = router;