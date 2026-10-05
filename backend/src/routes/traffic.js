const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/authMiddleware');
const trafficController = require('../controllers/trafficController');

// Protected routes
router.use(protect);

// Traffic authority and admin
router.use(authorize('traffic', 'admin'));

router.get('/incidents', trafficController.getTrafficIncidents);
router.post('/incidents', trafficController.reportTrafficIncident);
router.put('/incidents/:id', trafficController.updateTrafficIncident);
router.delete('/incidents/:id', trafficController.deleteTrafficIncident);

router.get('/cameras', trafficController.getTrafficCameras);
router.post('/cameras', trafficController.addTrafficCamera);
router.put('/cameras/:id', trafficController.updateTrafficCamera);
router.delete('/cameras/:id', trafficController.deleteTrafficCamera);

router.get('/signals', trafficController.getTrafficSignals);
router.post('/signals', trafficController.addTrafficSignal);
router.put('/signals/:id', trafficController.updateTrafficSignal);
router.delete('/signals/:id', trafficController.deleteTrafficSignal);

router.get('/congestion', trafficController.getCongestionData);
router.get('/green-corridors', trafficController.getGreenCorridors);
router.post('/green-corridors/request', trafficController.requestGreenCorridor);
router.put('/green-corridors/:id/approve', trafficController.approveGreenCorridor);
router.put('/green-corridors/:id/reject', trafficController.rejectGreenCorridor);

router.get('/analytics', trafficController.getTrafficAnalytics);
router.get('/heatmap', trafficController.getTrafficHeatmap);

module.exports = router;