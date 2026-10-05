const Hospital = require('../models/Hospital');
const { seedHospitals } = require('../utils/hospitalSeeder');

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

// @desc    Get all hospitals (with search & filter)
// @route   GET /api/hospitals
// @access  Public
const getHospitals = async (req, res, next) => {
  try {
    // Proactively seed database if empty
    await seedHospitals();

    const { search, status, department, specialist, area } = req.query;
    let query = {};

    if (search) {
      query.name = { $regex: search, $options: 'i' };
    }
    if (status) {
      query.status = status;
    }
    if (area) {
      query.area = { $regex: area, $options: 'i' };
    }
    if (department) {
      query.departments = department;
    }
    if (specialist) {
      query.specialists = specialist;
    }

    const hospitals = await Hospital.find(query);
    res.status(200).json(hospitals);
  } catch (error) {
    next(error);
  }
};

// @desc    Get nearby hospitals
// @route   GET /api/hospitals/nearby
// @access  Public
const getNearbyHospitals = async (req, res, next) => {
  try {
    await seedHospitals();

    // Default coordinates to City Mall, Mangalore if not provided
    const longitude = parseFloat(req.query.longitude) || 74.8560;
    const latitude = parseFloat(req.query.latitude) || 12.9141;
    const maxDistanceKm = parseFloat(req.query.maxDistance) || 20;

    // Use geospatial $near query if index is ready
    let hospitals = [];
    try {
      hospitals = await Hospital.find({
        location: {
          $near: {
            $geometry: {
              type: 'Point',
              coordinates: [longitude, latitude] // [long, lat]
            },
            $maxDistance: maxDistanceKm * 1000 // meters
          }
        }
      });
    } catch (geoError) {
      // Fallback: load all and sort manually in JS
      console.warn('Geospatial index query failed, falling back to manual distance sorting:', geoError.message);
      const allHospitals = await Hospital.find({});
      hospitals = allHospitals
        .map(h => {
          const hCoords = h.location.coordinates; // [long, lat]
          const distance = calculateDistance(latitude, longitude, hCoords[1], hCoords[0]);
          return { ...h.toObject(), distance };
        })
        .filter(h => h.distance <= maxDistanceKm)
        .sort((a, b) => a.distance - b.distance);
    }

    // Attach computed distances if not already present
    const mapped = hospitals.map(h => {
      if (h.distance !== undefined) return h;
      const hCoords = h.location.coordinates;
      const dist = calculateDistance(latitude, longitude, hCoords[1], hCoords[0]);
      return { ...h.toObject ? h.toObject() : h, distance: Math.round(dist * 10) / 10 };
    });

    res.status(200).json(mapped);
  } catch (error) {
    next(error);
  }
};

// @desc    Get hospital by ID
// @route   GET /api/hospitals/:id
// @access  Public
const getHospitalById = async (req, res, next) => {
  try {
    const hospital = await Hospital.findById(req.params.id);
    if (!hospital) {
      res.status(404);
      return next(new Error('Hospital not found'));
    }
    res.status(200).json(hospital);
  } catch (error) {
    next(error);
  }
};

// @desc    Create new hospital
// @route   POST /api/hospitals
// @access  Private/Admin
const createHospital = async (req, res, next) => {
  try {
    const { name, code, latitude, longitude, address, area, phone, emergencyContact, hospitalType, emergencyDepartmentAvailable, status } = req.body;

    // Check if code exists
    const exists = await Hospital.findOne({ code });
    if (exists) {
      res.status(400);
      return next(new Error('Hospital with this code already exists'));
    }

    // Format coordinates
    const longVal = parseFloat(longitude) || 74.85;
    const latVal = parseFloat(latitude) || 12.86;

    const hospital = await Hospital.create({
      name,
      code: code.toUpperCase(),
      hospitalType: hospitalType || 'General',
      location: {
        type: 'Point',
        coordinates: [longVal, latVal]
      },
      address: address || { street: 'Main St', city: 'Mangalore', state: 'Karnataka', pincode: '575001' },
      area: area || 'Central',
      contact: {
        phone: phone || '+91 824 242 4242',
        emergency: emergencyContact || '+91 824 242 4243'
      },
      emergencyDepartmentAvailable: emergencyDepartmentAvailable !== undefined ? emergencyDepartmentAvailable : true,
      status: status || 'operational',
      createdBy: req.user ? req.user._id : null
    });

    res.status(201).json(hospital);
  } catch (error) {
    next(error);
  }
};

// @desc    Update hospital
// @route   PUT /api/hospitals/:id
// @access  Private/Admin/Hospital
const updateHospital = async (req, res, next) => {
  try {
    const hospital = await Hospital.findById(req.params.id);
    if (!hospital) {
      res.status(404);
      return next(new Error('Hospital not found'));
    }

    // Update coordinates if lat/long passed
    if (req.body.latitude !== undefined || req.body.longitude !== undefined) {
      const longVal = parseFloat(req.body.longitude) !== undefined ? parseFloat(req.body.longitude) : hospital.location.coordinates[0];
      const latVal = parseFloat(req.body.latitude) !== undefined ? parseFloat(req.body.latitude) : hospital.location.coordinates[1];
      hospital.location = {
        type: 'Point',
        coordinates: [longVal, latVal]
      };
    }

    // Update simple fields
    if (req.body.name) hospital.name = req.body.name;
    if (req.body.hospitalType) hospital.hospitalType = req.body.hospitalType;
    if (req.body.area) hospital.area = req.body.area;
    if (req.body.address) hospital.address = { ...hospital.address, ...req.body.address };
    if (req.body.phone) hospital.contact.phone = req.body.phone;
    if (req.body.emergencyContact) hospital.contact.emergency = req.body.emergencyContact;
    if (req.body.status) hospital.status = req.body.status;
    if (req.body.emergencyDepartmentAvailable !== undefined) hospital.emergencyDepartmentAvailable = req.body.emergencyDepartmentAvailable;
    if (req.body.departments) hospital.departments = req.body.departments;
    if (req.body.specialists) hospital.specialists = req.body.specialists;

    hospital.updatedBy = req.user ? req.user._id : null;
    const updated = await hospital.save();
    res.status(200).json(updated);
  } catch (error) {
    next(error);
  }
};

// @desc    Delete hospital
// @route   DELETE /api/hospitals/:id
// @access  Private/Admin
const deleteHospital = async (req, res, next) => {
  try {
    const hospital = await Hospital.findById(req.params.id);
    if (!hospital) {
      res.status(404);
      return next(new Error('Hospital not found'));
    }

    await hospital.deleteOne();
    res.status(200).json({ success: true, message: 'Hospital deleted successfully' });
  } catch (error) {
    next(error);
  }
};

// @desc    Get hospital resources
// @route   GET /api/hospitals/:id/resources
// @access  Private
const getHospitalResources = async (req, res, next) => {
  try {
    const hospital = await Hospital.findById(req.params.id);
    if (!hospital) {
      res.status(404);
      return next(new Error('Hospital not found'));
    }

    res.status(200).json(hospital.resources || {});
  } catch (error) {
    next(error);
  }
};

// @desc    Update hospital resources
// @route   PUT /api/hospitals/:id/resources
// @access  Private/Hospital/Admin
const updateHospitalResources = async (req, res, next) => {
  try {
    const hospital = await Hospital.findById(req.params.id);
    if (!hospital) {
      res.status(404);
      return next(new Error('Hospital not found'));
    }

    // Merge resources from body
    if (req.body) {
      hospital.resources = {
        beds: { ...hospital.resources.beds, ...req.body.beds },
        equipment: { ...hospital.resources.equipment, ...req.body.equipment },
        blood: { ...hospital.resources.blood, ...req.body.blood },
        staff: { ...hospital.resources.staff, ...req.body.staff },
        emergencyCapacity: { ...hospital.resources.emergencyCapacity, ...req.body.emergencyCapacity }
      };

      // Also compute load percentage based on beds occupied/total
      const totalBeds = hospital.resources.beds.total || 1;
      const occupiedBeds = hospital.resources.beds.occupied || 0;
      hospital.currentLoad = Math.min(100, Math.max(0, Math.round((occupiedBeds / totalBeds) * 100)));
    }

    hospital.updatedBy = req.user ? req.user._id : null;
    const updated = await hospital.save();
    res.status(200).json(updated.resources);
  } catch (error) {
    next(error);
  }
};

// @desc    Get hospital staff
// @route   GET /api/hospitals/:id/staff
// @access  Private
const getHospitalStaff = async (req, res, next) => {
  try {
    const hospital = await Hospital.findById(req.params.id);
    if (!hospital) {
      res.status(404);
      return next(new Error('Hospital not found'));
    }

    res.status(200).json({
      specialists: hospital.specialists || [],
      staff: hospital.resources?.staff || {}
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getHospitals,
  getNearbyHospitals,
  getHospitalById,
  createHospital,
  updateHospital,
  deleteHospital,
  getHospitalResources,
  updateHospitalResources,
  getHospitalStaff
};
