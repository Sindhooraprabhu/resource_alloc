const mongoose = require('mongoose');

const incidentReportSchema = new mongoose.Schema({
  // Basic information
  reportId: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  type: {
    type: String,
    required: [true, 'Please specify incident type'],
    enum: ['accident', 'fire', 'medical', 'crime', 'hazard', 'other']
  },
  subtype: {
    type: String,
    // Will be validated based on type
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
      required: [true, 'Please add incident location coordinates']
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
  verifiedAt: {
    type: Date
  },
  // Reporter information
  reportedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Please specify who reported the incident']
  },
  // Incident details
  description: {
    type: String,
    required: [true, 'Please add incident description'],
    trim: true
  },
  severity: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    default: 'medium'
  },
  // Media attachments
  media: {
    images: [{
      url: {
        type: String,
        required: true
      },
      caption: {
        type: String,
        trim: true
      },
      uploadedAt: {
        type: Date,
        default: Date.now
      }
    }],
    videos: [{
      url: {
        type: String,
        required: true
      },
      caption: {
        type: String,
        trim: true
      },
      uploadedAt: {
        type: Date,
        default: Date.now
      },
      duration: {
        type: Number, // in seconds
        min: [0, 'Duration must be positive']
      }
    }],
    audio: [{
      url: {
        type: String,
        required: true
      },
      caption: {
        type: String,
        trim: true
      },
      uploadedAt: {
        type: Date,
        default: Date.now
      },
      duration: {
        type: Number, // in seconds
        min: [0, 'Duration must be positive']
      }
    }]
  },
  // Witness information
  witnesses: [{
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
    },
    statement: {
      type: String,
      trim: true
    }
  }],
  // Environmental factors
  weather: {
    type: String,
    enum: ['clear', 'cloudy', 'rainy', 'stormy', 'foggy', 'snowy']
  },
  lighting: {
    type: String,
    enum: ['daylight', 'dusk', 'dawn', 'night', 'artificial']
  },
  // Verification status
  status: {
    type: String,
    enum: ['pending', 'verified', 'rejected', 'duplicate'],
    default: 'pending'
  },
  verification: {
    verifiedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    notes: {
      type: String,
      trim: true
    }
  },
  // Associated emergency (if any)
  relatedEmergency: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Emergency'
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
incidentReportSchema.index({ location: '2dsphere' });
incidentReportSchema.index({ status: 1 });
incidentReportSchema.index({ severity: 1 });
incidentReportSchema.index({ reportedAt: -1 });
incidentReportSchema.index({ type: 1, subtype: 1 });

module.exports = mongoose.model('IncidentReport', incidentReportSchema);