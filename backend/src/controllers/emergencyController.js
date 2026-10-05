const Emergency = require('../models/Emergency');
const Hospital = require('../models/Hospital');
const AllocationHistory = require('../models/AllocationHistory');
const Ambulance = require('../models/Ambulance');
const allocationEngine = require('../services/allocationEngine');
const { geocodeAddress } = require('../services/routePlanner');

// Helper to calculate distance in km using Haversine formula
const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // Radius of the earth in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c; // Distance in km
};

// Intelligent Hospital Allocation Engine Scoring function
const scoreHospital = (hospital, patientLat, patientLong, requirements) => {
  const { bedType, specialist, equipment, severity, traffic } = requirements;

  // If not operational or not accepting emergency patients, exclude immediately (score = 0)
  if (hospital.status !== 'operational' ||
    (hospital.resources?.emergencyCapacity?.acceptingEmergencyPatients === false)) {
    return { score: 0, reasons: ['Hospital status is not operational or emergency department is not accepting patients'] };
  }

  let score = 100;
  const positiveReasons = [];
  const negativeReasons = [];

  // 1. Distance & Travel Time (Weight: 30 points)
  const hCoords = hospital.location.coordinates; // [longitude, latitude]
  const dist = calculateDistance(patientLat, patientLong, hCoords[1], hCoords[0]);

  // Compute estimated travel time
  let travelSpeedKmh = 45; // base speed
  if (traffic === 'heavy') travelSpeedKmh = 20;
  else if (traffic === 'moderate') travelSpeedKmh = 35;
  else if (traffic === 'light') travelSpeedKmh = 55;

  const travelTimeMinutes = Math.round((dist / travelSpeedKmh) * 60);

  // Deduct based on distance
  if (dist <= 2) {
    positiveReasons.push(`Very close: ${dist.toFixed(1)} km away (${travelTimeMinutes} mins)`);
  } else if (dist <= 5) {
    score -= 5;
    positiveReasons.push(`Moderate distance: ${dist.toFixed(1)} km away (${travelTimeMinutes} mins)`);
  } else if (dist <= 10) {
    score -= 15;
    negativeReasons.push(`Far: ${dist.toFixed(1)} km away (${travelTimeMinutes} mins)`);
  } else {
    score -= 25;
    negativeReasons.push(`Very far: ${dist.toFixed(1)} km away (${travelTimeMinutes} mins)`);
  }

  // 2. Required Bed Availability (Weight: 25 points)
  if (bedType && bedType !== 'None') {
    const beds = hospital.resources?.beds || {};
    if (bedType === 'ICU') {
      const icuAvailable = beds.icuAvailable || 0;
      if (icuAvailable > 0) {
        positiveReasons.push(`ICU bed available (${icuAvailable} vacant)`);
      } else {
        score -= 25;
        negativeReasons.push('No ICU beds available');
      }
    } else if (bedType === 'Emergency') {
      const emergencyAvailable = beds.emergencyAvailable || 0;
      if (emergencyAvailable > 0) {
        positiveReasons.push(`Emergency bed available (${emergencyAvailable} vacant)`);
      } else {
        score -= 25;
        negativeReasons.push('No Emergency beds available');
      }
    } else if (bedType === 'General') {
      const available = beds.available || 0;
      if (available > 0) {
        positiveReasons.push(`General bed available (${available} vacant)`);
      } else {
        score -= 20;
        negativeReasons.push('No general beds available');
      }
    }
  } else {
    positiveReasons.push('Bed availability matches patient profile');
  }

  // 3. Specialist Availability (Weight: 20 points)
  if (specialist) {
    const specialistsList = hospital.specialists || [];
    const isSpecialistAvailable = specialistsList.includes(specialist);

    // Also check on-duty count
    const onDuty = hospital.resources?.staff?.specialistsAvailable || 0;

    if (isSpecialistAvailable && onDuty > 0) {
      positiveReasons.push(`Required specialist (${specialist}) is on duty`);
    } else if (isSpecialistAvailable) {
      score -= 10;
      negativeReasons.push(`Required specialist (${specialist}) registered but currently off-duty`);
    } else {
      score -= 20;
      negativeReasons.push(`Hospital does not have a ${specialist}`);
    }
  }

  // 4. Critical Equipment & Blood (Weight: 15 points)
  if (equipment) {
    if (equipment.toLowerCase().includes('ventilator')) {
      const vents = hospital.resources?.equipment?.ventilatorsAvailable || 0;
      if (vents > 0) {
        positiveReasons.push(`Ventilator available (${vents} vacant)`);
      } else {
        score -= 15;
        negativeReasons.push('No ventilators available');
      }
    }
  }

  // 5. Emergency Load & Capacities (Weight: 10 points)
  const cap = hospital.resources?.emergencyCapacity || {};
  const currentLoad = cap.currentLoad || 'LOW';

  if (currentLoad === 'HIGH') {
    score -= 10;
    negativeReasons.push(`High current emergency load (${cap.waitingPatients || 0} waiting)`);
  } else if (currentLoad === 'MODERATE') {
    score -= 5;
    positiveReasons.push('Moderate emergency room load');
  } else {
    positiveReasons.push('Low emergency load, quick admissions');
  }

  // Final check: clamp score
  score = Math.max(0, Math.min(100, score));

  return {
    score,
    travelTime: travelTimeMinutes,
    distance: dist,
    reasons: [...positiveReasons, ...negativeReasons]
  };
};

// @desc    Activate emergency SOS via AI call
// @route   POST /api/emergencies/sos
// @access  Public (simulates emergency trigger)
const activateSOS = async (req, res, next) => {
  try {
    const {
      type, subtype, latitude, longitude, address, description, additionalDetails,
      patient, symptoms, severity, traffic, contactPerson, intakeChannel
    } = req.body;

    const typedAddress = typeof address === 'string' ? address.trim() : '';
    let patientLat = Number.parseFloat(latitude);
    let patientLong = Number.parseFloat(longitude);

    // Keep manually entered address text and route coordinates synchronized.
    const addressNeedsGeocoding = typedAddress
      && !/^Lat:\s*-?\d+(\.\d+)?,\s*Lng:/i.test(typedAddress)
      && !/\(Default\)$/i.test(typedAddress);
    if (addressNeedsGeocoding) {
      const geocoded = await geocodeAddress(typedAddress);
      patientLat = geocoded.latitude;
      patientLong = geocoded.longitude;
    }

    if (!Number.isFinite(patientLat) || !Number.isFinite(patientLong)) {
      patientLat = 12.9141;
      patientLong = 74.8560;
    }

    // Generate unique emergency ID
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const randStr = Math.random().toString(36).substring(2, 6).toUpperCase();
    const emergencyId = `SOS-${dateStr}-${randStr}`;

    // Use the allocation engine to determine required resources dynamically
    const requirements = allocationEngine.determineRequiredResources({
      type: type || 'medical',
      subtype: subtype || 'other',
      description: description || '',
      symptoms: symptoms || [],
      severity: severity || 5,
      patient: patient || {}
    });

    const requiredResource = {
      bedType: requirements.bedType,
      specialist: requirements.specialist,
      equipment: Array.isArray(requirements.equipment) ? requirements.equipment.join(', ') : (requirements.equipment || '')
    };

    const normalizedPatient = patient && typeof patient === 'object' ? patient : {};
    const normalizedSymptoms = Array.isArray(symptoms)
      ? symptoms.filter(Boolean)
      : (symptoms ? [symptoms] : []);

    // Create the Emergency Case in DB
    const emergency = await Emergency.create({
      emergencyId,
      intakeChannel: intakeChannel === 'TOLL_FREE_AI' ? 'TOLL_FREE_AI' : 'APP',
      type: type || 'medical',
      subtype: subtype || 'other',
      location: {
        type: 'Point',
        coordinates: [patientLong, patientLat]
      },
      address: address || 'City Mall, Mangalore',
      patient: normalizedPatient,
      symptoms: normalizedSymptoms,
      severity: severity || 7,
      description: description || additionalDetails || 'Emergency reported through the emergency intake channel',
      caseStatus: 'REQUESTED',
      status: 'reported',
      requiredResource,
      priority: requirements.priority,
      reportedBy: req.user?._id,
      contactPerson: contactPerson || {},
      timeline: [{
        event: 'REQUEST_RECEIVED',
        description: `Emergency request received via ${intakeChannel === 'TOLL_FREE_AI' ? 'toll-free AI caller' : 'app form'}`,
        actor: intakeChannel === 'TOLL_FREE_AI' ? 'AI_AGENT' : 'PATIENT'
      }]
    });

    // Run the shared allocation engine so the recommendation, route, ambulance
    // record, and allocation history use the same transaction path as AI calls.
    const allocation = await allocationEngine.allocateEmergencyResources(emergency._id, {
      requirements
    });
    const allocatedEmergency = await Emergency.findById(emergency._id)
      .populate('assignedHospital', 'name code area')
      .populate('assignedAmbulance', 'vehicleNumber vehicleType status crew');

    const evaluated = allocation.evaluated || (allocation.recommendedHospital ? [allocation.recommendedHospital] : []);
    const topRecommendation = allocation.recommendedHospital;

    // Notify the assigned hospital via Socket.IO
    const io = req.app.get('io');
    if (io) {
      if (topRecommendation?.hospital) io.to(`hospital_${topRecommendation.hospital.toString()}`).emit('incomingEmergency', {
        emergencyId: emergency._id,
        sosCode: emergencyId,
        patient: emergency.patient,
        severity: emergency.severity,
        symptoms: emergency.symptoms,
        requiredResource: allocatedEmergency?.requiredResource || emergency.requiredResource,
        eta: `${allocation.recommendedHospital?.travelTime || topRecommendation.travelTime} min`,
        explanation: allocation.explanation,
        reservations: allocation.reservations,
        ambulance: allocation.ambulance,
        doctor: allocation.doctor
      });
    }

    res.status(201).json({
      emergency: allocatedEmergency || emergency,
      recommendations: evaluated.map(item => ({
        hospitalId: item.hospital,
        name: item.name,
        score: item.score,
        distance: item.distance,
        travelTime: item.travelTime,
        route: item.route,
        reasons: item.reasons
      })),
      allocationId: allocation._id,
      requirements
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get active emergencies
// @route   GET /api/emergencies/active
// @access  Private
const getActiveEmergencies = async (req, res, next) => {
  try {
    let query = { status: { $nin: ['completed', 'cancelled'] } };

    // If logged in as a hospital staff, only get active emergencies assigned to them
    if (req.user && req.user.role === 'hospital') {
      const hospital = await Hospital.findOne({ 'contact.email': req.user.email });
      if (hospital) {
        query.assignedHospital = hospital._id;
      }
    }

    const emergencies = await Emergency.find(query)
      .populate('assignedHospital')
      .populate('assignedAmbulance')
      .sort({ reportedAt: -1 });

    res.status(200).json(emergencies);
  } catch (error) {
    next(error);
  }
};

// @desc    Get emergency history
// @route   GET /api/emergencies/history
// @access  Private
const getEmergencyHistory = async (req, res, next) => {
  try {
    let query = {};
    if (req.user && req.user.role === 'hospital') {
      const hospital = await Hospital.findOne({ 'contact.email': req.user.email });
      if (hospital) {
        query.assignedHospital = hospital._id;
      }
    }

    const emergencies = await Emergency.find(query)
      .populate('assignedHospital')
      .populate('assignedAmbulance')
      .sort({ reportedAt: -1 });

    res.status(200).json(emergencies);
  } catch (error) {
    next(error);
  }
};

// @desc    Get emergency by ID
// @route   GET /api/emergencies/:id
// @access  Private
const getEmergencyById = async (req, res, next) => {
  try {
    const emergency = await Emergency.findById(req.params.id)
      .populate('assignedHospital')
      .populate('assignedAmbulance');

    if (!emergency) {
      res.status(404);
      return next(new Error('Emergency case not found'));
    }

    res.status(200).json(emergency);
  } catch (error) {
    next(error);
  }
};

// @desc    Get all allocation history entries
// @route   GET /api/emergencies/allocation-history
// @access  Private
const getAllAllocationHistories = async (req, res, next) => {
  try {
    const histories = await AllocationHistory.find({})
      .populate('recommendedHospital', 'name code area')
      .populate('alternativeHospitals.hospital', 'name code area')
      .populate('patientId', 'name email')
      .populate('finalHospital', 'name code area')
      .sort({ createdAt: -1 });

    res.status(200).json(histories);
  } catch (error) {
    next(error);
  }
};

// @desc    Update emergency caseStatus, status & trigger resource reservations
// @route   PUT /api/emergencies/:id/status
// @access  Private
const updateEmergencyStatus = async (req, res, next) => {
  try {
    const emergency = await Emergency.findById(req.params.id);
    if (!emergency) {
      res.status(404);
      return next(new Error('Emergency case not found'));
    }

    const { status, caseStatus, action, rejectionReason, infoRequest, assignedHospital } = req.body;
    const oldCaseStatus = emergency.caseStatus;

    if (assignedHospital) {
      emergency.assignedHospital = assignedHospital;
    }

    // Handle acceptance actions from hospital dashboard using the allocation engine
    if (action === 'accept') {
      const result = await allocationEngine.confirmHospitalAcceptance(emergency._id, assignedHospital || emergency.assignedHospital);

      // Copy the updated emergency state
      const updatedEmergency = result.emergency;

      // Add timeline event
      emergency.timeline.push({
        event: 'HOSPITAL_ACCEPTED',
        description: `Hospital accepted the emergency. Resources locked.`,
        actor: 'HOSPITAL',
        metadata: {
          hospital: updatedEmergency.assignedHospital,
          reservations: result.reservations
        }
      });

      emergency.patientHandover = {
        shared: true,
        sharedAt: new Date(),
        vitals: emergency.initialVitals || {
          heartRate: 92,
          spo2: 96,
          temperature: 98.6,
          bloodPressure: { systolic: 120, diastolic: 80 }
        },
        eta: 10
      };

      // Update AllocationHistory status (already done by engine, but update patient handover)
      emergency.timeline.push({
        event: 'PATIENT_INFO_SHARED',
        description: 'Patient vitals, location, and ETA shared with hospital',
        actor: 'SYSTEM',
        metadata: emergency.patientHandover
      });
    }
    // Handle rejection actions using the allocation engine: triggers re-routing
    else if (action === 'reject') {
      const result = await allocationEngine.rejectHospitalAllocation(
        emergency._id,
        emergency.assignedHospital,
        rejectionReason || 'No capacity'
      );

      emergency.timeline.push({
        event: 'HOSPITAL_REJECTED',
        description: `Hospital rejected the emergency. Reason: ${rejectionReason || 'No capacity'}`,
        actor: 'HOSPITAL',
        metadata: {
          hospital: emergency.assignedHospital,
          rejectionReason
        }
      });

      if (result.success) {
        emergency.timeline.push({
          event: 'REALLOCATION_TRIGGERED',
          description: `Allocation engine reallocated to next best hospital`,
          actor: 'SYSTEM',
          metadata: {
            explanation: result.explanation
          }
        });
      }
    }
    // Handle needs info
    else if (action === 'needs_info') {
      emergency.caseStatus = 'WAITING FOR CONFIRMATION';
      if (infoRequest) {
        emergency.description += `\n[Hospital Request]: ${infoRequest}`;
      }

      emergency.timeline.push({
        event: 'INFO_REQUESTED',
        description: `Hospital requested additional information: ${infoRequest || 'Not specified'}`,
        actor: 'HOSPITAL'
      });

      await AllocationHistory.findOneAndUpdate(
        { caseId: emergency._id },
        { hospitalResponse: 'NEEDS_INFORMATION' }
      );
    }
    // Handle regular dispatch updates
    else {
      if (status) emergency.status = status;
      if (caseStatus) emergency.caseStatus = caseStatus;

      // Handle transitions like ADMITTED or CANCELLED to manage reservations
      if (caseStatus === 'ADMITTED') {
        await allocationEngine.completeEmergencyResources(emergency._id, false);
        emergency.status = 'completed';
        emergency.caseStatus = 'ADMITTED';
      } else if (caseStatus === 'CANCELLED' || status === 'cancelled') {
        await allocationEngine.completeEmergencyResources(emergency._id, true);
        emergency.status = 'cancelled';
        emergency.caseStatus = 'CANCELLED';
      }
    }

    const updated = await emergency.save();

    // Broadcast update via Socket.IO
    const io = req.app.get('io');
    if (io) {
      io.emit('emergencyUpdated', {
        emergencyId: updated._id,
        status: updated.status,
        caseStatus: updated.caseStatus,
        assignedHospital: updated.assignedHospital
      });
      // specific hospital room broadcast
      io.to(`hospital_${updated.assignedHospital.toString()}`).emit('requestStatusChanged', {
        emergencyId: updated._id,
        caseStatus: updated.caseStatus
      });
    }

    res.status(200).json(updated);
  } catch (error) {
    next(error);
  }
};

// @desc    Get allocation history for an emergency
// @route   GET /api/emergencies/:id/allocation-history
// @access  Private
const getAllocationHistory = async (req, res, next) => {
  try {
    const history = await AllocationHistory.find({ caseId: req.params.id })
      .populate('recommendedHospital', 'name code area')
      .populate('alternativeHospitals.hospital', 'name code area')
      .populate('patientId', 'name email')
      .populate('finalHospital', 'name code area')
      .sort({ decisionTime: -1 });

    res.status(200).json(history);
  } catch (error) {
    next(error);
  }
};

// @desc    Get nearby hospitals list
// @route   GET /api/emergencies/nearby/hospitals
// @access  Private
const getNearbyHospitals = async (req, res, next) => {
  try {
    const { latitude, longitude } = req.query;
    const lat = parseFloat(latitude) || 12.9141;
    const long = parseFloat(longitude) || 74.8560;

    const hospitals = await Hospital.find({ status: 'operational' });
    const mapped = hospitals.map(h => {
      const hCoords = h.location.coordinates;
      const distance = calculateDistance(lat, long, hCoords[1], hCoords[0]);
      return {
        _id: h._id,
        name: h.name,
        distance: Math.round(distance * 10) / 10,
        icuBeds: h.resources?.beds?.icuAvailable || 0,
        status: h.status
      };
    }).sort((a, b) => a.distance - b.distance);

    res.status(200).json(mapped);
  } catch (error) {
    next(error);
  }
};

// @desc    Report incident (mocked)
// @route   POST /api/emergencies/incident
// @access  Private
const reportIncident = async (req, res, next) => {
  res.status(201).json({ success: true, message: 'Incident reported successfully' });
};

// @desc    Get incident reports (mocked)
// @route   GET /api/emergencies/incidents
// @access  Private
const getIncidentReports = async (req, res, next) => {
  res.status(200).json([]);
};

// @desc    Save push subscription for emergency notifications
// @route   POST /api/emergencies/:id/push-subscription
// @access  Public
const savePushSubscription = async (req, res, next) => {
  try {
    const { subscription } = req.body;
    const { id } = req.params;

    if (!subscription) {
      res.status(400);
      return next(new Error('Subscription is required'));
    }

    const emergency = await Emergency.findById(id);
    if (!emergency) {
      res.status(404);
      return next(new Error('Emergency case not found'));
    }

    emergency.pushSubscription = subscription;
    await emergency.save();

    res.status(200).json({ success: true, message: 'Push subscription saved' });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  activateSOS,
  getActiveEmergencies,
  getEmergencyHistory,
  getEmergencyById,
  updateEmergencyStatus,
  getAllAllocationHistories,
  getAllocationHistory,
  getNearbyHospitals,
  reportIncident,
  getIncidentReports,
  savePushSubscription
};
