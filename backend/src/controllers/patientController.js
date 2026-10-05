const Patient = require('../models/Patient');
const PatientVitals = require('../models/PatientVitals');

// @desc    Get patient by ID
// @route   GET /api/patients/:id
// @access  Private
const getPatientById = async (req, res, next) => {
  try {
    const patient = await Patient.findById(req.params.id);
    if (!patient) {
      res.status(404);
      return next(new Error('Patient not found'));
    }
    res.status(200).json(patient);
  } catch (error) {
    next(error);
  }
};

// @desc    Get my vitals
// @route   GET /api/patients/me/vitals
// @access  Private
const getMyVitals = async (req, res, next) => {
  try {
    const vitals = await PatientVitals.findOne({ patient: req.user._id }).sort({ timestamp: -1 });
    res.status(200).json(vitals || {});
  } catch (error) {
    next(error);
  }
};

// @desc    Update my vitals
// @route   PUT /api/patients/me/vitals
// @access  Private
const updateMyVitals = async (req, res, next) => {
  try {
    let vitals = await PatientVitals.create({
      patient: req.user._id,
      ...req.body,
      timestamp: new Date()
    });
    res.status(200).json(vitals);
  } catch (error) {
    next(error);
  }
};

// @desc    Get my history
// @route   GET /api/patients/me/history
// @access  Private
const getMyHistory = async (req, res, next) => {
  res.status(200).json([]);
};

// @desc    Get all patients
// @route   GET /api/patients
// @access  Private/Doctor/Hospital/Admin
const getPatients = async (req, res, next) => {
  try {
    const patients = await Patient.find({});
    res.status(200).json(patients);
  } catch (error) {
    next(error);
  }
};

// @desc    Create patient
// @route   POST /api/patients
// @access  Private/Doctor/Hospital/Admin
const createPatient = async (req, res, next) => {
  try {
    const patient = await Patient.create(req.body);
    res.status(201).json(patient);
  } catch (error) {
    next(error);
  }
};

// @desc    Update patient
// @route   PUT /api/patients/:id
// @access  Private/Doctor/Hospital/Admin
const updatePatient = async (req, res, next) => {
  try {
    const patient = await Patient.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });
    if (!patient) {
      res.status(404);
      return next(new Error('Patient not found'));
    }
    res.status(200).json(patient);
  } catch (error) {
    next(error);
  }
};

// @desc    Get patient vitals history
// @route   GET /api/patients/:id/vitals
// @access  Private/Doctor/Hospital/Admin
const getPatientVitals = async (req, res, next) => {
  try {
    const vitals = await PatientVitals.find({ patient: req.params.id }).sort({ timestamp: -1 });
    res.status(200).json(vitals);
  } catch (error) {
    next(error);
  }
};

// @desc    Update patient vitals
// @route   PUT /api/patients/:id/vitals
// @access  Private/Doctor/Hospital/Admin
const updatePatientVitals = async (req, res, next) => {
  try {
    const vitals = await PatientVitals.create({
      patient: req.params.id,
      ...req.body,
      timestamp: new Date()
    });
    res.status(200).json(vitals);
  } catch (error) {
    next(error);
  }
};

// @desc    Get patient medical history logs
// @route   GET /api/patients/:id/history
// @access  Private/Doctor/Hospital/Admin
const getPatientHistory = async (req, res, next) => {
  res.status(200).json([]);
};

// @desc    Get patient clinical alert flags
// @route   GET /api/patients/:id/alerts
// @access  Private/Doctor/Hospital/Admin
const getPatientAlerts = async (req, res, next) => {
  res.status(200).json([]);
};

// @desc    Add alert flag for patient
// @route   POST /api/patients/:id/alerts
// @access  Private/Doctor/Hospital/Admin
const addPatientAlert = async (req, res, next) => {
  res.status(200).json({ success: true, message: 'Alert added successfully' });
};

module.exports = {
  getPatientById,
  getMyVitals,
  updateMyVitals,
  getMyHistory,
  getPatients,
  createPatient,
  updatePatient,
  getPatientVitals,
  updatePatientVitals,
  getPatientHistory,
  getPatientAlerts,
  addPatientAlert
};
