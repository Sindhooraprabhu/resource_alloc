const mongoose = require('mongoose');

const hospitalSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please add a hospital name'],
    trim: true
  },
  code: {
    type: String,
    required: [true, 'Please add a hospital code'],
    unique: true,
    uppercase: true,
    trim: true
  },
  location: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point'
    },
    coordinates: {
      type: [Number], // [longitude, latitude]
      required: [true, 'Please add location coordinates']
    }
  },
  address: {
    street: {
      type: String,
      required: [true, 'Please add street address']
    },
    city: {
      type: String,
      required: [true, 'Please add city']
    },
    state: {
      type: String,
      required: [true, 'Please add state']
    },
    pincode: {
      type: String,
      required: [true, 'Please add pincode'],
      match: [/^\d{6}$/, 'Please add a valid 6-digit pincode']
    },
    country: {
      type: String,
      default: 'India'
    }
  },
  contact: {
    phone: {
      type: String,
      required: [true, 'Please add phone number'],
      match: [
        /^(?:(?:\+91[\-\s]?)?(?:0?[6789]\d{9}|0?[1-9]\d{2,4}(?:[\-\s]?\d{3,4}){1,2}))$/,
        'Please add a valid Indian phone number'
      ]
    },
    emergency: {
      type: String,
      required: [true, 'Please add emergency contact number'],
      match: [
        /^(?:(?:\+91[\-\s]?)?(?:0?[6789]\d{9}|0?[1-9]\d{2,4}(?:[\-\s]?\d{3,4}){1,2}))$/,
        'Please add a valid Indian phone number'
      ]
    },
    email: {
      type: String,
      match: [
        /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
        'Please add a valid email'
      ]
    }
  },
  details: {
    establishedYear: {
      type: Number,
      min: [1800, 'Establishment year must be after 1800'],
      max: [new Date().getFullYear(), 'Establishment year cannot be in the future']
    },
    bedCapacity: {
      total: {
        type: Number,
        min: [0, 'Bed capacity must be positive'],
        default: 0
      },
      icu: {
        type: Number,
        min: [0, 'ICU bed capacity must be positive'],
        default: 0
      },
      general: {
        type: Number,
        min: [0, 'General bed capacity must be positive'],
        default: 0
      }
    },
    equipment: {
      ventilators: {
        type: Number,
        min: [0, 'Ventilator count must be positive'],
        default: 0
      },
      operationTheatres: {
        type: Number,
        min: [0, 'Operation theatre count must be positive'],
        default: 0
      },
      bloodBank: {
        type: Boolean,
        default: false
      },
      pharmacy: {
        type: Boolean,
        default: true
      },
      laboratory: {
        type: Boolean,
        default: true
      },
      radiology: {
        type: Boolean,
        default: true
      }
    },
    departments: [{
      type: String,
      enum: [
        'Emergency',
        'Cardiology',
        'Neurology',
        'Orthopedics',
        'Pediatrics',
        'OB-GYN',
        'Oncology',
        'Nephrology',
        'Gastroenterology',
        'Pulmonology',
        'Endocrinology',
        'Dermatology',
        'Psychiatry',
        'Radiology',
        'Pathology',
        'Anesthesiology',
        'Emergency Medicine',
        'General Surgery',
        'Neurosurgery',
        'Other'
      ]
    }],
    specialties: [{
      type: String,
      enum: [
        'Trauma Center',
        'Stroke Center',
        'Heart Center',
        'Burn Unit',
        'Neonatal ICU',
        'Organ Transplant',
        'Cancer Center',
        'Children Hospital'
      ]
    }]
  },
  hospitalType: {
    type: String,
    enum: ['General', 'Specialty', 'Super Specialty', 'Clinic', 'Other'],
    default: 'General'
  },
  area: {
    type: String,
    required: [true, 'Please add an area/neighborhood in Mangalore'],
    trim: true
  },
  emergencyDepartmentAvailable: {
    type: Boolean,
    default: true
  },
  specialists: [{
    type: String,
    enum: [
      'Cardiologist',
      'Neurologist',
      'Orthopedic specialist',
      'Neurosurgeon',
      'General surgeon',
      'Emergency physician',
      'Pediatrician',
      'Pulmonologist',
      'Anesthesiologist'
    ]
  }],
  resources: {
    beds: {
      total: { type: Number, default: 0 },
      available: { type: Number, default: 0 },
      occupied: { type: Number, default: 0 },
      icuTotal: { type: Number, default: 0 },
      icuAvailable: { type: Number, default: 0 },
      icuReserved: { type: Number, default: 0 },
      emergencyTotal: { type: Number, default: 0 },
      emergencyAvailable: { type: Number, default: 0 },
      emergencyReserved: { type: Number, default: 0 }
    },
    equipment: {
      ventilatorsTotal: { type: Number, default: 0 },
      ventilatorsAvailable: { type: Number, default: 0 },
      ventilatorsReserved: { type: Number, default: 0 },
      ecgMachinesTotal: { type: Number, default: 0 },
      ecgMachinesAvailable: { type: Number, default: 0 },
      oxygenAvailable: { type: String, enum: ['AVAILABLE', 'LIMITED', 'UNAVAILABLE'], default: 'AVAILABLE' },
      operationTheatresTotal: { type: Number, default: 0 },
      operationTheatresAvailable: { type: Number, default: 0 },
      operationTheatresReserved: { type: Number, default: 0 },
      emergencyEquipment: { type: String, enum: ['AVAILABLE', 'LIMITED', 'UNAVAILABLE'], default: 'AVAILABLE' }
    },
    blood: {
      ap: { type: Number, default: 0 }, // A+
      am: { type: Number, default: 0 }, // A-
      bp: { type: Number, default: 0 }, // B+
      bm: { type: Number, default: 0 }, // B-
      op: { type: Number, default: 0 }, // O+
      om: { type: Number, default: 0 }, // O-
      abp: { type: Number, default: 0 }, // AB+
      abm: { type: Number, default: 0 }  // AB-
    },
    staff: {
      doctorsAvailable: { type: Number, default: 0 },
      emergencyDoctors: { type: Number, default: 0 },
      specialistsAvailable: { type: Number, default: 0 },
      nursesAvailable: { type: Number, default: 0 },
      emergencyStaff: { type: Number, default: 0 }
    },
    emergencyCapacity: {
      currentLoad: { type: String, enum: ['LOW', 'MODERATE', 'HIGH'], default: 'LOW' },
      waitingPatients: { type: Number, default: 0 },
      emergencyRoomCapacity: { type: Number, default: 0 },
      estimatedWaitingTime: { type: Number, default: 0 }, // in minutes
      acceptingEmergencyPatients: { type: Boolean, default: true }
    }
  },
  ratings: {
    average: {
      type: Number,
      min: [0, 'Rating must be between 0 and 5'],
      max: [5, 'Rating must be between 0 and 5'],
      default: 0
    },
    count: {
      type: Number,
      min: [0, 'Rating count must be positive'],
      default: 0
    }
  },
  status: {
    type: String,
    enum: ['operational', 'maintenance', 'offline', 'emergency_only'],
    default: 'operational'
  },
  currentLoad: {
    type: Number,
    min: [0, 'Load percentage must be between 0 and 100'],
    max: [100, 'Load percentage must be between 0 and 100'],
    default: 0
  },
  // Administrative fields
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

// Index for geospatial queries
hospitalSchema.index({ location: '2dsphere' });

module.exports = mongoose.model('Hospital', hospitalSchema);