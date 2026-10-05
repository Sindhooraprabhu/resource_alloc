const mongoose = require('mongoose');

const patientSchema = new mongoose.Schema({
  // Basic information
  patientId: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  mrn: {
    type: String, // Medical Record Number
    required: [true, 'Please add MRN'],
    unique: true,
    trim: true
  },
  // Personal information
  name: {
    type: String,
    required: [true, 'Please add patient name'],
    trim: true
  },
  dateOfBirth: {
    type: Date,
    required: [true, 'Please add date of birth']
  },
  age: {
    type: Number,
    min: [0, 'Age must be positive'],
    max: [150, 'Age cannot exceed 150'],
    // This will be calculated from dateOfBirth in middleware
  },
  gender: {
    type: String,
    required: [true, 'Please specify gender'],
    enum: ['male', 'female', 'other']
  },
  bloodGroup: {
    type: String,
    enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']
  },
  // Contact information
  phone: {
    type: String,
    match: [
      /^(\+91[\-\s]?)?[0]?(91)?[6789]\d{9}$/,
      'Please add a valid Indian phone number'
    ]
  },
  email: {
    type: String,
    match: [
      /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
      'Please add a valid email'
    ]
  },
  address: {
    street: {
      type: String,
      trim: true
    },
    city: {
      type: String,
      trim: true
    },
    state: {
      type: String,
      trim: true
    },
    pincode: {
      type: String,
      match: [/^\d{6}$/, 'Please add a valid 6-digit pincode']
    },
    country: {
      type: String,
      default: 'India'
    }
  },
  // Emergency contact
  emergencyContact: [{
    name: {
      type: String,
      required: [true, 'Please add emergency contact name']
    },
    relationship: {
      type: String,
      required: [true, 'Please specify relationship']
    },
    phone: {
      type: String,
      required: [true, 'Please add emergency contact phone'],
      match: [
        /^(\+91[\-\s]?)?[0]?(91)?[6789]\d{9}$/,
        'Please add a valid Indian phone number'
      ]
    }
  }],
  // Medical information
  medicalHistory: {
    allergies: [String],
    conditions: [String],
    surgeries: [String],
    medications: [String],
    familyHistory: [String],
    habits: {
      smoking: {
        type: Boolean,
        default: false
      },
      alcohol: {
        type: Boolean,
        default: false
      },
      tobacco: {
        type: Boolean,
        default: false
      },
      drugs: {
        type: Boolean,
        default: false
      }
    }
  },
  // Current status
  status: {
    type: String,
    enum: ['outpatient', 'inpatient', 'emergency', 'icu', 'operation', 'recovery', 'discharged', 'deceased'],
    default: 'outpatient'
  },
  // Admission information
  admission: {
    date: {
      type: Date
    },
    time: {
      type: String
    },
    admittingDoctor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    admittingHospital: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Hospital'
    },
    ward: {
      type: String
    },
    bedNumber: {
      type: String
    },
    reason: {
      type: String,
      trim: true
    }
  },
  // Associated records
  emergencies: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Emergency'
  }],
  hospitalizations: [{
    admissionDate: {
      type: Date
    },
    dischargeDate: {
      type: Date
    },
    hospital: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Hospital'
    },
    diagnosis: [String],
    procedures: [String],
    outcome: {
      type: String,
      enum: ['recovered', 'complications', 'deceased', 'referred']
    }
  }],
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

// Calculate age before saving
patientSchema.pre('save', function(next) {
  if (this.dateOfBirth) {
    const today = new Date();
    let age = today.getFullYear() - this.dateOfBirth.getFullYear();
    const m = today.getMonth() - this.dateOfBirth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < this.dateOfBirth.getDate())) {
      age--;
    }
    this.age = age;
  }
  next();
});

// Indexes for efficient querying
patientSchema.index({ mrn: 1 });
patientSchema.index({ 'emergencyContact.phone': 1 });
patientSchema.index({ status: 1 });
patientSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Patient', patientSchema);