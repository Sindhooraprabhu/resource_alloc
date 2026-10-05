const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/authMiddleware');
const ambulanceController = require('../controllers/ambulanceController');

// Public routes (limited info)
router.get('/', ambulanceController.getAmbulances);
router.get('/:id', ambulanceController.getAmbulanceById);

// Protected routes
router.use(protect);

// Ambulance staff and admin
router.post('/', authorize('admin', 'ambulance'), ambulanceController.createAmbulance);
router.put('/:id', authorize('admin', 'ambulance'), ambulanceController.updateAmbulance);
router.delete('/:id', authorize('admin'), ambulanceController.deleteAmbulance);
router.post('/:id/assign', authorize('admin', 'ambulance'), ambulanceController.assignAmbulance);
router.put('/:id/location', authorize('admin', 'ambulance'), ambulanceController.updateLocation);
router.patch('/:id/location', authorize('admin', 'ambulance'), ambulanceController.updateLocation);
router.get('/:id/status', authorize('admin', 'ambulance'), ambulanceController.getStatus);
router.patch('/:id/status', authorize('admin', 'ambulance'), ambulanceController.updateStatus);
router.get('/:id/route', authorize('admin', 'ambulance'), ambulanceController.getRoute);

// Patient vitals updates (from ambulance or IoT devices)
router.post('/:id/vitals', ambulanceController.updateAmbulanceVitals);
router.get('/:id/vitals/history', ambulanceController.getAmbulanceVitalsHistory);

module.exports = router;