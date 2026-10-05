const User = require('../models/User');
const jwt = require('jsonwebtoken');

// Generate JWT helper
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'your_jwt_secret_key_here_change_in_production', {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d'
  });
};

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
const register = async (req, res, next) => {
  try {
    const { name, email, password, role, phone, profile } = req.body;

    // Check if user exists
    const userExists = await User.findOne({ email });
    if (userExists) {
      res.status(400);
      return next(new Error('User already exists'));
    }

    // Create user
    const user = await User.create({
      name,
      email,
      password,
      role: role || 'citizen',
      phone,
      profile
    });

    if (user) {
      res.status(201).json({
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
        token: generateToken(user._id)
      });
    } else {
      res.status(400);
      return next(new Error('Invalid user data'));
    }
  } catch (error) {
    next(error);
  }
};

// @desc    Auth user & get token
// @route   POST /api/auth/login
// @access  Public
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Check for user
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      res.status(401);
      return next(new Error('Invalid email or password'));
    }

    // Check password
    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      res.status(401);
      return next(new Error('Invalid email or password'));
    }

    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      phone: user.phone,
      token: generateToken(user._id)
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Log user out
// @route   POST /api/auth/logout
// @access  Private
const logout = async (req, res, next) => {
  res.status(200).json({ success: true, message: 'Logged out successfully' });
};

// @desc    Get current logged in user
// @route   GET /api/auth/me
// @access  Private
const getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    res.status(200).json(user);
  } catch (error) {
    next(error);
  }
};

// @desc    Update user profile
// @route   PUT /api/auth/update-profile
// @access  Private
const updateProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);

    if (user) {
      user.name = req.body.name || user.name;
      user.phone = req.body.phone || user.phone;
      if (req.body.profile) {
        user.profile = { ...user.profile, ...req.body.profile };
      }

      const updatedUser = await user.save();

      res.json({
        _id: updatedUser._id,
        name: updatedUser.name,
        email: updatedUser.email,
        role: updatedUser.role,
        phone: updatedUser.phone,
        token: generateToken(updatedUser._id)
      });
    } else {
      res.status(44);
      return next(new Error('User not found'));
    }
  } catch (error) {
    next(error);
  }
};

// @desc    Change password
// @route   PUT /api/auth/change-password
// @access  Private
const changePassword = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id).select('+password');
    const { currentPassword, newPassword } = req.body;

    if (!user) {
      res.status(404);
      return next(new Error('User not found'));
    }

    const isMatch = await user.matchPassword(currentPassword);
    if (!isMatch) {
      res.status(400);
      return next(new Error('Current password is incorrect'));
    }

    user.password = newPassword;
    await user.save();

    res.status(200).json({ success: true, message: 'Password changed successfully' });
  } catch (error) {
    next(error);
  }
};

// @desc    Forgot password placeholder
// @route   POST /api/auth/forgot-password
// @access  Public
const forgotPassword = async (req, res, next) => {
  res.status(200).json({ success: true, message: 'Password reset link sent (mocked)' });
};

// @desc    Reset password placeholder
// @route   PUT /api/auth/reset-password/:token
// @access  Public
const resetPassword = async (req, res, next) => {
  res.status(200).json({ success: true, message: 'Password has been reset (mocked)' });
};

// @desc    Refresh token placeholder
// @route   POST /api/auth/refresh-token
// @access  Public
const refreshToken = async (req, res, next) => {
  const { refreshToken } = req.body;
  res.status(200).json({ success: true, token: 'mocked-refreshed-token' });
};

module.exports = {
  register,
  login,
  logout,
  getMe,
  updateProfile,
  changePassword,
  forgotPassword,
  resetPassword,
  refreshToken
};
