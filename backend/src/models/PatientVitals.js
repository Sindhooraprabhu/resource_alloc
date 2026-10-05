const mongoose = require('mongoose');

const patientVitalsSchema = new mongoose.Schema({
  // Reference to patient
  patient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Patient',
    required: [true, 'Please specify patient']
  },
  // Reference to emergency/hospitalization (optional)
  encounter: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Emergency'
  },
  // Timestamp
  recordedAt: {
    type: Date,
    default: Date.now,
    required: [true, 'Please specify recording time']
  },
  // Vital signs
  vitals: {
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
    },
    perfusionIndex: {
      type: Number,
      min: [0, 'Perfusion index must be positive'],
      max: [20, 'Perfusion index must be between 0 and 20']
    },
    // Advanced vitals (optional)
    co2: {
      type: Number,
      min: [0, 'CO2 must be positive'],
      max: [100, 'CO2 must be between 0 and 100 mmHg']
    },
    ph: {
      type: Number,
      min: [6.8, 'pH must be between 6.8 and 7.8'],
      max: [7.8, 'pH must be between 6.8 and 7.8']
    },
    lactate: {
      type: Number,
      min: [0, 'Lactate must be positive'],
      max: [20, 'Lactate must be between 0 and 20 mmol/L']
    }
  },
  // ECG data (stored as base64 or reference to file)
  ecg: {
    data: {
      type: String, // Base64 encoded ECG data or file reference
      // In production, this would likely be a reference to file storage
    },
    lead: {
      type: String,
      enum: ['I', 'II', 'III', 'aVR', 'aVL', 'aVF', 'V1', 'V2', 'V3', 'V4', 'V5', 'V6'],
      default: 'II'
    },
    samplingRate: {
      type: Number,
      min: [100, 'Sampling rate must be at least 100 Hz'],
      max: [1000, 'Sampling rate must be at most 1000 Hz'],
      default: 500
    },
    duration: {
      type: Number, // in seconds
      min: [1, 'Duration must be at least 1 second'],
      max: [60, 'Duration must be at most 60 seconds'],
      default: 10
    }
  },
  // Respiratory data
  respiratory: {
    rate: {
      type: Number,
      min: [5, 'Respiratory rate must be between 5 and 50'],
      max: [50, 'Respiratory rate must be between 5 and 50']
    },
    effort: {
      type: String,
      enum: ['normal', 'increased', 'decreased', 'labored']
    },
    pattern: {
      type: String,
      enum: ['regular', 'irregular', 'periodic', 'apneic']
    }
  },
  // Neurological assessment
  neurological: {
    gcs: {
      type: Number,
      min: [3, 'GCS must be between 3 and 15'],
      max: [15, 'GCS must be between 3 and 15']
    },
    pupils: {
      left: {
        size: {
          type: Number,
          min: [1, 'Pupil size must be between 1 and 10 mm'],
          max: [10, 'Pupil size must be between 1 and 10 mm']
        },
        reaction: {
          type: String,
          enum: ['brisk', 'sluggish', 'fixed', 'unequal']
        }
      },
      right: {
        size: {
          type: Number,
          min: [1, 'Pupil size must be between 1 and 10 mm'],
          max: [10, 'Pupil size must be between 1 and 10 mm']
        },
        reaction: {
          type: String,
          enum: ['brisk', 'sluggish', 'fixed', 'unequal']
        }
      }
    },
    movement: {
      type: String,
      enum: ['normal', 'weak', 'paralyzed', 'spastic']
    }
  },
  // Pain assessment
  pain: {
    score: {
      type: Number,
      min: [0, 'Pain score must be between 0 and 10'],
      max: [10, 'Pain score must be between 0 and 10']
    },
    location: {
      type: String,
      trim: true
    },
    quality: {
      type: String,
      enum: ['sharp', 'dull', 'burning', 'throbbing', 'cramping', 'aching']
    }
  },
  // Quality and reliability
  quality: {
    type: String,
    enum: ['excellent', 'good', 'fair', 'poor'],
    default: 'good'
    // Indicates reliability of the measurements
  },
  // Source of data
  source: {
    type: String,
    enum: ['manual', 'monitor', 'ems', 'hospital', 'iot_device', 'self_reported'],
    default: 'manual'
  },
  // Device information (if from IoT device)
  deviceInfo: {
    deviceId: {
      type: String,
      trim: true
    },
    deviceType: {
      type: String,
      enum: ['ESP32', 'RaspberryPi', 'Arduino', 'Commercial_Monitor', 'Smartwatch']
    },
    firmwareVersion: {
      type: String,
      trim: true
    },
    batteryLevel: {
      type: Number,
      min: [0, 'Battery level must be between 0 and 100%'],
      max: [100, 'Battery level must be between 0 and 100%']
    }
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
patientVitalsSchema.index({ patient: 1, recordedAt: -1 });
patientVitalsSchema.index({ encounter: 1 });
patientVitalsSchema.index({ recordedAt: -1 });
patientVitalsSchema.index({ source: 1 });

module.exports = mongoose.model('PatientVitals', patientVitalsSchema);