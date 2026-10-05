const Ambulance = require('../models/Ambulance');
const Emergency = require('../models/Emergency');

// @desc    Get all ambulances
// @route   GET /api/ambulances
// @access  Public
const getAmbulances = async (req, res, next) => {
  try {
    const { status, vehicleType } = req.query;
    let query = {};
    if (status) query.status = status;
    if (vehicleType) query.vehicleType = vehicleType;

    const ambulances = await Ambulance.find(query).populate('crew.driver');
    res.status(200).json(ambulances);
  } catch (error) {
    next(error);
  }
};

// @desc    Get ambulance by ID
// @route   GET /api/ambulances/:id
// @access  Public
const getAmbulanceById = async (req, res, next) => {
  try {
    const ambulance = await Ambulance.findById(req.params.id)
      .populate('crew.driver')
      .populate('crew.paramedic')
      .populate('crew.emt');
    if (!ambulance) {
      res.status(404);
      return next(new Error('Ambulance not found'));
    }
    res.status(200).json(ambulance);
  } catch (error) {
    next(error);
  }
};

// @desc    Create new ambulance
// @route   POST /api/ambulances
// @access  Private/Admin
const createAmbulance = async (req, res, next) => {
  try {
    const ambulance = await Ambulance.create({
      ...req.body,
      createdBy: req.user ? req.user._id : null
    });
    res.status(201).json(ambulance);
  } catch (error) {
    next(error);
  }
};

// @desc    Update ambulance
// @route   PUT /api/ambulances/:id
// @access  Private
const updateAmbulance = async (req, res, next) => {
  try {
    const ambulance = await Ambulance.findByIdAndUpdate(
      req.params.id,
      { ...req.body, updatedBy: req.user ? req.user._id : null },
      { new: true, runValidators: true }
    );
    if (!ambulance) {
      res.status(404);
      return next(new Error('Ambulance not found'));
    }
    res.status(200).json(ambulance);
  } catch (error) {
    next(error);
  }
};

// @desc    Delete ambulance
// @route   DELETE /api/ambulances/:id
// @access  Private/Admin
const deleteAmbulance = async (req, res, next) => {
  try {
    const ambulance = await Ambulance.findById(req.params.id);
    if (!ambulance) {
      res.status(404);
      return next(new Error('Ambulance not found'));
    }
    await ambulance.deleteOne();
    res.status(200).json({ success: true, message: 'Ambulance deleted' });
  } catch (error) {
    next(error);
  }
};

// @desc    Assign ambulance to case
// @route   POST /api/ambulances/:id/assign
// @access  Private
const assignAmbulance = async (req, res, next) => {
  try {
    if (!req.body.emergencyId) {
      res.status(400);
      return next(new Error('emergencyId is required'));
    }
    const ambulance = await Ambulance.findOneAndUpdate(
      { _id: req.params.id, status: 'available' },
      { $set: { status: 'en_route', currentAssignment: req.body.emergencyId } },
      { new: true }
    );
    if (!ambulance) {
      const exists = await Ambulance.exists({ _id: req.params.id });
      if (!exists) {
        res.status(404);
        return next(new Error('Ambulance not found'));
      }
      res.status(404);
      return next(new Error('Ambulance is already assigned or unavailable'));
    }
    res.status(200).json(ambulance);
  } catch (error) {
    next(error);
  }
};

// @desc    Update location
// @route   PUT /api/ambulances/:id/location
// @access  Private
const updateLocation = async (req, res, next) => {
  try {
    const ambulance = await Ambulance.findById(req.params.id);
    if (!ambulance) {
      res.status(404);
      return next(new Error('Ambulance not found'));
    }
    if (req.user?.role === 'ambulance'
      && req.user.ambulanceInfo?.vehicleNumber !== ambulance.vehicleNumber) {
      res.status(403);
      return next(new Error('This driver is not linked to this ambulance'));
    }
    const { longitude, latitude } = req.body;
    ambulance.currentLocation = {
      type: 'Point',
      coordinates: [parseFloat(longitude), parseFloat(latitude)]
    };
    await ambulance.save();
    const io = req.app.get('io');
    if (io && ambulance.currentAssignment) {
      const emergency = await Emergency.findById(ambulance.currentAssignment).select('assignedHospital');
      if (emergency) {
        emergency.patientHandover = {
          ...(emergency.patientHandover || {}),
          shared: true,
          sharedAt: emergency.patientHandover?.sharedAt || new Date(),
          ambulanceLocation: { latitude: parseFloat(latitude), longitude: parseFloat(longitude) }
        };
        emergency.timeline.push({
          event: 'AMBULANCE_LOCATION_UPDATED',
          description: 'Ambulance location updated from the active vehicle feed',
          actor: 'AMBULANCE',
          metadata: { location: ambulance.currentLocation }
        });
        await emergency.save();
      }
      const locationUpdate = {
        ambulanceId: ambulance._id,
        location: ambulance.currentLocation,
        status: ambulance.status
      };
      io.to(`emergency_${ambulance.currentAssignment}`).emit('ambulanceLocationUpdated', locationUpdate);
      if (emergency?.assignedHospital) {
        io.to(`hospital_${emergency.assignedHospital}`).emit('ambulanceLocationUpdated', {
          ...locationUpdate,
          emergencyId: ambulance.currentAssignment
        });
      }
    }
    res.status(200).json(ambulance);
  } catch (error) {
    next(error);
  }
};

const updateStatus = async (req, res, next) => {
  try {
    const ambulance = await Ambulance.findByIdAndUpdate(
      req.params.id,
      { status: req.body.status },
      { new: true, runValidators: true }
    );
    if (!ambulance) {
      res.status(404);
      return next(new Error('Ambulance not found'));
    }
    if (ambulance.currentAssignment) {
      const emergency = await Emergency.findById(ambulance.currentAssignment);
      if (emergency) {
        const caseStatus = req.body.status === 'en_route'
          ? 'AMBULANCE EN ROUTE'
          : req.body.status === 'at_scene' ? 'PATIENT PICKED UP' : emergency.caseStatus;
        emergency.status = req.body.status;
        emergency.caseStatus = caseStatus;
        emergency.timeline.push({
          event: 'AMBULANCE_STATUS_UPDATED',
          description: `Ambulance status changed to ${req.body.status}`,
          actor: 'AMBULANCE'
        });
        await emergency.save();
      }
    }
    const io = req.app.get('io');
    if (io && ambulance.currentAssignment) {
      io.to(`emergency_${ambulance.currentAssignment}`).emit('ambulanceStatusUpdated', {
        ambulanceId: ambulance._id,
        status: ambulance.status
      });
    }
    res.status(200).json(ambulance);
  } catch (error) {
    next(error);
  }
};

// @desc    Get status
// @route   GET /api/ambulances/:id/status
// @access  Private
const getStatus = async (req, res, next) => {
  try {
    const ambulance = await Ambulance.findById(req.params.id);
    if (!ambulance) {
      res.status(404);
      return next(new Error('Ambulance not found'));
    }
    res.status(200).json({ status: ambulance.status });
  } catch (error) {
    next(error);
  }
};

// @desc    Get route
// @route   GET /api/ambulances/:id/route
// @access  Private
const getRoute = async (req, res, next) => {
  try {
    const ambulance = await Ambulance.findById(req.params.id).select('currentAssignment');
    if (!ambulance) {
      res.status(404);
      return next(new Error('Ambulance not found'));
    }
    const emergency = ambulance.currentAssignment
      ? await Emergency.findById(ambulance.currentAssignment).select('routePlan')
      : null;
    res.status(200).json({
      type: 'LineString',
      coordinates: emergency?.routePlan?.path || []
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update vitals
// @route   POST /api/ambulances/:id/vitals
// @access  Private
const updateAmbulanceVitals = async (req, res, next) => {
  res.status(200).json({ success: true, message: 'Ambulance vitals updated' });
};

// @desc    Get vitals history
// @route   GET /api/ambulances/:id/vitals/history
// @access  Private
const getAmbulanceVitalsHistory = async (req, res, next) => {
  res.status(200).json([]);
};

module.exports = {
  getAmbulances,
  getAmbulanceById,
  createAmbulance,
  updateAmbulance,
  deleteAmbulance,
  assignAmbulance,
  updateLocation,
  updateStatus,
  getStatus,
  getRoute,
  updateAmbulanceVitals,
  getAmbulanceVitalsHistory
};
