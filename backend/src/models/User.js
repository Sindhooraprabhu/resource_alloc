const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please add a name'],
    trim: true
  },
  email: {
    type: String,
    required: [true, 'Please add an email'],
    unique: true,
    trim: true,
    lowercase: true,
    match: [
      /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
      'Please add a valid email'
    ]
  },
  password: {
    type: String,
    required: [true, 'Please add a password'],
    minlength: [6, 'Password must be at least 6 characters'],
    select: false
  },
  phone: {
    type: String,
    match: [
      /^(\+91[\-\s]?)?[0]?(91)?[6789]\d{9}$/,
      'Please add a valid Indian phone number'
    ]
  },
  role: {
    type: String,
    enum: ['citizen', 'ambulance', 'hospital', 'doctor', 'traffic', 'admin'],
    default: 'citizen'
  },
  profile: {
    avatar: {
      type: String,
      default: ''
    },
    bio: {
      type: String,
      maxlength: 500
    },
    dateOfBirth: {
      type: Date
    },
    gender: {
      type: String,
      enum: ['male', 'female', 'other']
    },
    address: {
      street: String,
      city: String,
      state: String,
      pincode: String,
      country: {
        type: String,
        default: 'India'
      }
    }
  },
  // Role-specific fields
  doctorInfo: {
    specialization: String,
    licenseNumber: String,
    experienceYears: Number,
    hospitalId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Hospital'
    },
    availabilityStatus: {
      type: String,
      enum: ['available', 'assigned', 'off_duty'],
      default: 'available'
    },
    currentAssignment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Emergency'
    }
  },
  hospitalInfo: {
    hospitalName: String,
    licenseNumber: String,
    establishedYear: Number,
    bedCapacity: Number,
    emergencyContact: String
  },
  ambulanceInfo: {
    vehicleNumber: String,
    licenseNumber: String,
    vehicleType: {
      type: String,
      enum: ['ALS', 'BLS', 'PTV', 'Neonatal']
    },
    baseLocation: String,
    assignedTo: String
  },
  trafficInfo: {
    badgeNumber: String,
    department: String,
    jurisdiction: String
  },
  // Status fields
  isActive: {
    type: Boolean,
    default: true
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  lastLogin: {
    type: Date
  },
  loginAttempts: {
    type: Number,
    default: 0
  },
  lockUntil: {
    type: Date
  }
}, {
  timestamps: true
});

// Hash password before saving
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) {
    next();
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Compare password method
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Generate JWT token
userSchema.methods.getSignedJwtToken = function () {
  return jwt.sign({ id: this._id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN
  });
};

module.exports = mongoose.model('User', userSchema);