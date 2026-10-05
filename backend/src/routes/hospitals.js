const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/authMiddleware');
const hospitalController = require('../controllers/hospitalController');

// Public routes
router.get('/', hospitalController.getHospitals);
router.get('/nearby', hospitalController.getNearbyHospitals);
router.get('/:id', hospitalController.getHospitalById);

// Protected routes
router.use(protect);

// Admin and hospital staff only
router.post('/', authorize('admin', 'hospital'), hospitalController.createHospital);
router.put('/:id', authorize('admin', 'hospital'), hospitalController.updateHospital);
router.delete('/:id', authorize('admin'), hospitalController.deleteHospital);
router.get('/:id/resources', authorize('admin', 'hospital'), hospitalController.getHospitalResources);
router.put('/:id/resources', authorize('admin', 'hospital'), hospitalController.updateHospitalResources);
router.get('/:id/staff', authorize('admin', 'hospital'), hospitalController.getHospitalStaff);

module.exports = router;