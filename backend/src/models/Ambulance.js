const mongoose = require('mongoose');

const ambulanceSchema = new mongoose.Schema({
  vehicleNumber: {
    type: String,
    required: [true, 'Please add vehicle number'],
    unique: true,
    trim: true,
    uppercase: true
  },
  licenseNumber: {
    type: String,
    required: [true, 'Please add license number'],
    unique: true,
    trim: true
  },
  vehicleType: {
    type: String,
    required: [true, 'Please add vehicle type'],
    enum: ['ALS', 'BLS', 'PTV', 'Neonatal'],
    default: 'BLS'
  },
  baseLocation: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point'
    },
    coordinates: {
      type: [Number], // [longitude, latitude]
      required: [true, 'Please add base location coordinates']
    }
  },
  currentLocation: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point'
    },
    coordinates: {
      type: [Number], // [longitude, latitude]
    }
  },
  status: {
    type: String,
    enum: ['available', 'en_route', 'at_scene', 'returning', 'maintenance', 'offline'],
    default: 'available'
  },
  // Capacity and equipment
  capacity: {
    patients: {
      type: Number,
      min: [1, 'Patient capacity must be at least 1'],
      max: [4, 'Patient capacity cannot exceed 4'],
      default: 2
    },
    equipment: {
      ventilator: {
        type: Boolean,
        default: false
      },
      defibrillator: {
        type: Boolean,
        default: true
      },
      ecgMonitor: {
        type: Boolean,
        default: true
      },
      infusionPumps: {
        type: Number,
        min: [0, 'Infusion pump count must be positive'],
        default: 2
      },
      oxygenSupply: {
        type: Boolean,
        default: true
      },
      suctionDevice: {
        type: Boolean,
        default: true
      },
      spineBoard: {
        type: Boolean,
        default: true
      },
      neckCollar: {
        type: Boolean,
        default: true
      },
      firstAidKit: {
        type: Boolean,
        default: true
      },
      birthKit: {
        type: Boolean,
        default: false
      }
    }
  },
  // Staffing
  crew: {
    driver: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Please assign a driver']
    },
    paramedic: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    emt: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  },
  // Maintenance
  maintenance: {
    lastService: {
      type: Date
    },
    nextService: {
      type: Date
    },
    mileage: {
      type: Number,
      min: [0, 'Mileage must be positive'],
      default: 0
    },
    fuelLevel: {
      type: Number,
      min: [0, 'Fuel level must be between 0 and 100'],
      max: [100, 'Fuel level must be between 0 and 100'],
      default: 100
    }
  },
  // Assignment tracking
  currentAssignment: {
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

// Index for geospatial queries
ambulanceSchema.index({ currentLocation: '2dsphere' });
ambulanceSchema.index({ baseLocation: '2dsphere' });

module.exports = mongoose.model('Ambulance', ambulanceSchema);