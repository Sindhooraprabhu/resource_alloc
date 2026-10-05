const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/authMiddleware');
const patientController = require('../controllers/patientController');

// Public routes (limited info)
router.get('/:id', protect, patientController.getPatientById);

// Protected routes
router.use(protect);

// Patient self-service
router.get('/me/vitals', patientController.getMyVitals);
router.put('/me/vitals', patientController.updateMyVitals);
router.get('/me/history', patientController.getMyHistory);

// Medical staff and admin
router.use(authorize('doctor', 'hospital', 'admin'));

router.get('/', patientController.getPatients);
router.post('/', patientController.createPatient);
router.put('/:id', patientController.updatePatient);
router.get('/:id/vitals', patientController.getPatientVitals);
router.put('/:id/vitals', patientController.updatePatientVitals);
router.get('/:id/history', patientController.getPatientHistory);
router.get('/:id/alerts', patientController.getPatientAlerts);
router.post('/:id/alerts', patientController.addPatientAlert);

module.exports = router;