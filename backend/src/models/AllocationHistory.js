const mongoose = require('mongoose');

const allocationHistorySchema = new mongoose.Schema({
  caseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Emergency',
    required: true
  },
  patientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  recommendedHospital: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Hospital',
    required: true
  },
  alternativeHospitals: [{
    hospital: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Hospital'
    },
    score: Number,
    reasons: [String]
  }],
  decisionTime: {
    type: Date,
    default: Date.now
  },
  reason: {
    type: String,
    required: true
  },
  resourcesRequired: {
    bedType: String,
    specialist: String,
    equipment: { type: [String], default: [] }
  },
  hospitalResponse: {
    type: String,
    enum: ['ACCEPTED', 'REJECTED', 'NEEDS_INFORMATION', 'PENDING'],
    default: 'PENDING'
  },
  rejectionReason: {
    type: String,
    default: ''
  },
  finalHospital: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Hospital'
  },
  travelTime: {
    type: Number, // in minutes
    required: true
  },
  status: {
    type: String,
    enum: ['requested', 'searching', 'confirmed', 'cancelled', 'completed'],
    default: 'requested'
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('AllocationHistory', allocationHistorySchema);
