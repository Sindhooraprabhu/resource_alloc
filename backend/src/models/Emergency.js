const mongoose = require('mongoose');

const emergencySchema = new mongoose.Schema({
  // Basic information
  emergencyId: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  type: {
    type: String,
    required: [true, 'Please specify emergency type'],
    enum: ['medical', 'accident', 'fire', 'crime', 'natural_disaster', 'other']
  },
  subtype: {
    type: String,
    enum: [
      // Medical subtypes
      'cardiac', 'respiratory', 'neurological', 'trauma', 'obstetric',
      'pediatric', 'geriatric', 'psychiatric', 'toxicological',
      // Accident subtypes
      'rta', 'fall', 'burn', 'drowning', 'electrocution',
      // Fire subtypes
      'structural', 'vehicle', 'wildfire', 'chemical',
      // Crime subtypes
      'assault', 'robbery', 'shooting', 'stabbing', 'other'
    ]
  },
  // Location
  location: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point'
    },
    coordinates: {
      type: [Number], // [longitude, latitude]
      required: [true, 'Please add emergency location coordinates']
    }
  },
  address: {
    type: String,
    trim: true
  },
  // Timestamps
  reportedAt: {
    type: Date,
    default: Date.now
  },
  dispatchedAt: {
    type: Date
  },
  arrivedAtScene: {
    type: Date
  },
  arrivedAtHospital: {
    type: Date
  },
  completedAt: {
    type: Date
  },
  // Patient information
  patient: {
    name: {
      type: String,
      trim: true
    },
    age: {
      type: Number,
      min: [0, 'Age must be positive'],
      max: [150, 'Age cannot exceed 150']
    },
    gender: {
      type: String,
      enum: ['male', 'female', 'other']
    },
    weight: {
      type: Number,
      min: [2, 'Weight must be at least 2kg'],
      max: [300, 'Weight cannot exceed 300kg']
    },
    height: {
      type: Number,
      min: [50, 'Height must be at least 50cm'],
      max: [250, 'Height cannot exceed 250cm']
    },
    bloodGroup: {
      type: String,
      enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']
    },
    allergies: [String],
    medications: [String],
    conditions: [String]
  },
  // Vital signs at time of report
  initialVitals: {
    heartRate: {
      type: Number,
      min: [20, 'Heart rate must be between 20 and 220'],
      max: [220, 'Heart rate must be between 20 and 220']
    },
    bloodPressure: {
      systolic: {
        type: Number,
        min: [40, 'Systolic BP must be between 40 and 300'],
        max: [300, 'Systolic BP must be between 40 and 300']
      },
      diastolic: {
        type: Number,
        min: [20, 'Diastolic BP must be between 20 and 200'],
        max: [200, 'Diastolic BP must be between 20 and 200']
      }
    },
    respiratoryRate: {
      type: Number,
      min: [5, 'Respiratory rate must be between 5 and 50'],
      max: [50, 'Respiratory rate must be between 5 and 50']
    },
    temperature: {
      type: Number,
      min: [90, 'Temperature must be between 90 and 110°F'],
      max: [110, 'Temperature must be between 90 and 110°F']
    },
    spo2: {
      type: Number,
      min: [50, 'SpO2 must be between 50 and 100%'],
      max: [100, 'SpO2 must be between 50 and 100%']
    },
    glucose: {
      type: Number,
      min: [20, 'Glucose must be between 20 and 600 mg/dL'],
      max: [600, 'Glucose must be between 20 and 600 mg/dL']
    }
  },
  // Current status
  status: {
    type: String,
    enum: [
      'reported',      // Initial report received
      'dispatching',   // Ambulance being dispatched
      'en_route',      // Ambulance on way to scene
      'at_scene',      // Ambulance at scene
      'treating',      // Treatment in progress
      'transporting',  // Patient being transported
      'hospital_arrival', // Arrived at hospital
      'handover',      // Handover to hospital staff
      'completed',     // Emergency resolved
      'cancelled'      // Emergency cancelled
    ],
    default: 'reported'
  },
  caseStatus: {
    type: String,
    enum: [
      'REQUESTED',
      'HOSPITAL SEARCH',
      'WAITING FOR CONFIRMATION',
      'HOSPITAL ACCEPTED',
      'HOSPITAL REJECTED',
      'AMBULANCE DISPATCHED',
      'PATIENT PICKED UP',
      'AMBULANCE EN ROUTE',
      'ARRIVED AT HOSPITAL',
      'ADMITTED',
      'COMPLETED',
      'CANCELLED'
    ],
    default: 'REQUESTED'
  },
  requiredResource: {
    bedType: {
      type: String,
      enum: ['ICU', 'General', 'Emergency', 'None'],
      default: 'None'
    },
    specialist: {
      type: String,
      default: ''
    },
    equipment: {
      type: String,
      default: ''
    }
  },
  aiAllocation: {
    provider: { type: String, default: 'local-resource-ai' },
    confidence: { type: Number, min: 0, max: 1, default: 0 },
    decision: { type: String, enum: ['RECOMMENDATION', 'LOW_CONFIDENCE', 'NO_CAPACITY', 'MANUAL_OVERRIDE'], default: 'RECOMMENDATION' },
    reasoning: [String],
    generatedAt: Date,
    humanReviewed: { type: Boolean, default: false }
  },
  // Priority and severity
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    default: 'medium'
  },
  severity: {
    type: Number,
    min: [1, 'Severity must be between 1 and 10'],
    max: [10, 'Severity must be between 1 and 10'],
    default: 5
  },
  // Description and notes
  description: {
    type: String,
    trim: true
  },
  symptoms: [String],
  interventions: [String],
  // Resources assigned
  assignedAmbulance: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Ambulance'
  },
  assignedHospital: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Hospital'
  },
  assignedDoctor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  routePlan: {
    algorithm: String,
    path: [[Number]],
    distanceKm: Number,
    etaMinutes: Number,
    traffic: String,
    calculatedAt: Date
  },
  // Dynamic Resource Allocation tracking
  resourceAllocation: {
    status: {
      type: String,
      enum: ['PENDING', 'RESERVED', 'RELEASED', 'COMPLETED', 'FAILED'],
      default: 'PENDING'
    },
    reservedAt: {
      type: Date
    },
    hospital: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Hospital'
    },
    resources: {
      bedType: String,
      specialist: String,
      equipment: String,
      notes: String
    },
    reservations: [{
      type: { type: String, required: true },
      quantity: { type: Number, default: 1 },
      status: { type: String, default: 'RESERVED' }
    }],
    releasedAt: {
      type: Date
    }
  },
  // Allocation attempts and history
  allocationAttempts: [{
    hospital: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Hospital'
    },
    score: Number,
    status: {
      type: String,
      enum: ['PENDING', 'ACCEPTED', 'REJECTED', 'EXPIRED'],
      default: 'PENDING'
    },
    reason: String,
    attemptedAt: {
      type: Date,
      default: Date.now
    },
    respondedAt: Date
  }],
  // Complete timeline of the emergency case
  timeline: [{
    event: {
      type: String,
      required: true
    },
    description: String,
    timestamp: {
      type: Date,
      default: Date.now
    },
    actor: {
      type: String,
      enum: ['SYSTEM', 'PATIENT', 'AMBULANCE', 'HOSPITAL', 'ADMIN', 'DOCTOR', 'AI_AGENT'],
      default: 'SYSTEM'
    },
    metadata: mongoose.Schema.Types.Mixed
  }],
  // Patient information shared with hospital after confirmation
  patientHandover: {
    shared: {
      type: Boolean,
      default: false
    },
    sharedAt: Date,
    vitals: {
      heartRate: Number,
      spo2: Number,
      temperature: Number,
      bloodPressure: {
        systolic: Number,
        diastolic: Number
      }
    },
    ambulanceLocation: {
      latitude: Number,
      longitude: Number
    },
    eta: Number // estimated arrival in minutes
  },
  // Reporting party
  intakeChannel: {
    type: String,
    enum: ['APP', 'TOLL_FREE_AI'],
    default: 'APP'
  },
  reportedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false
  },
  // Push notification subscription for real-time updates
  pushSubscription: {
    endpoint: String,
    keys: {
      p256dh: String,
      auth: String
    }
  },
  // Contact information
  contactPerson: {
    name: {
      type: String,
      trim: true
    },
    phone: {
      type: String,
      match: [
        /^(\+91[\-\s]?)?[0]?(91)?[6789]\d{9}$/,
        'Please add a valid Indian phone number'
      ]
    }
  },
  // Environmental factors
  weather: {
    type: String,
    enum: ['clear', 'cloudy', 'rainy', 'stormy', 'foggy', 'snowy']
  },
  roadConditions: {
    type: String,
    enum: ['dry', 'wet', 'icy', 'snowy', 'flooded', 'under_construction']
  },
  trafficConditions: {
    type: String,
    enum: ['light', 'moderate', 'heavy', 'standstill']
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

// Indexes for efficient querying
emergencySchema.index({ location: '2dsphere' });
emergencySchema.index({ status: 1 });
emergencySchema.index({ priority: 1 });
emergencySchema.index({ reportedAt: -1 });
emergencySchema.index({ 'patient.age': 1 });
emergencySchema.index({ type: 1, subtype: 1 });

module.exports = mongoose.model('Emergency', emergencySchema);