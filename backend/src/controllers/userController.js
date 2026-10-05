const User = require('../models/User');

// @desc    Get all users
// @route   GET /api/users
// @access  Private/Admin
const getUsers = async (req, res, next) => {
  try {
    const users = await User.find({});
    res.status(200).json(users);
  } catch (error) {
    next(error);
  }
};

// @desc    Get doctors as admin-managed allocation resources
// @route   GET /api/users/doctors
// @access  Private/Admin
const getDoctors = async (req, res, next) => {
  try {
    const doctors = await User.find({ role: 'doctor' })
      .select('name email phone isActive doctorInfo')
      .populate('doctorInfo.hospitalId', 'name code area');
    res.status(200).json(doctors);
  } catch (error) {
    next(error);
  }
};

// @desc    Get user by ID
// @route   GET /api/users/:id
// @access  Private/Admin
const getUserById = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      res.status(404);
      return next(new Error('User not found'));
    }
    res.status(200).json(user);
  } catch (error) {
    next(error);
  }
};

// @desc    Update user
// @route   PUT /api/users/:id
// @access  Private/Admin
const updateUser = async (req, res, next) => {
  try {
    const user = await User.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });
    if (!user) {
      res.status(404);
      return next(new Error('User not found'));
    }
    res.status(200).json(user);
  } catch (error) {
    next(error);
  }
};

// @desc    Delete user
// @route   DELETE /api/users/:id
// @access  Private/Admin
const deleteUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      res.status(404);
      return next(new Error('User not found'));
    }
    await user.deleteOne();
    res.status(200).json({ success: true, message: 'User deleted successfully' });
  } catch (error) {
    next(error);
  }
};

// @desc    Create new user
// @route   POST /api/users
// @access  Private/Admin
const createUser = async (req, res, next) => {
  try {
    const { name, email, password, role } = req.body;
    const exists = await User.findOne({ email });
    if (exists) {
      res.status(400);
      return next(new Error('User already exists'));
    }
    const user = await User.create({ name, email, password, role });
    res.status(201).json(user);
  } catch (error) {
    next(error);
  }
};

// @desc    Update user status
// @route   PUT /api/users/:id/status
// @access  Private/Admin
const updateUserStatus = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      res.status(404);
      return next(new Error('User not found'));
    }
    user.isActive = req.body.isActive !== undefined ? req.body.isActive : user.isActive;
    await user.save();
    res.status(200).json(user);
  } catch (error) {
    next(error);
  }
};

// @desc    Update user role
// @route   PUT /api/users/:id/role
// @access  Private/Admin
const updateUserRole = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      res.status(404);
      return next(new Error('User not found'));
    }
    user.role = req.body.role || user.role;
    await user.save();
    res.status(200).json(user);
  } catch (error) {
    next(error);
  }
};

// @desc    Get user activity logs (mocked)
// @route   GET /api/users/:id/activity
// @access  Private/Admin
const getUserActivity = async (req, res, next) => {
  res.status(200).json([]);
};

// @desc    Get my profile
// @route   GET /api/users/me/profile
// @access  Private
const getMyProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    res.status(200).json(user);
  } catch (error) {
    next(error);
  }
};

// @desc    Update my profile
// @route   PUT /api/users/me/profile
// @access  Private
const updateMyProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    if (user) {
      user.name = req.body.name || user.name;
      user.phone = req.body.phone || user.phone;
      if (req.body.profile) {
        user.profile = { ...user.profile, ...req.body.profile };
      }
      const updated = await user.save();
      res.status(200).json(updated);
    } else {
      res.status(404);
      return next(new Error('User not found'));
    }
  } catch (error) {
    next(error);
  }
};

// @desc    Change my password
// @route   PUT /api/users/me/password
// @access  Private
const changeMyPassword = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id).select('+password');
    const { currentPassword, newPassword } = req.body;

    const isMatch = await user.matchPassword(currentPassword);
    if (!isMatch) {
      res.status(400);
      return next(new Error('Incorrect current password'));
    }

    user.password = newPassword;
    await user.save();
    res.status(200).json({ success: true, message: 'Password updated successfully' });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getUsers,
  getDoctors,
  getUserById,
  updateUser,
  deleteUser,
  createUser,
  updateUserStatus,
  updateUserRole,
  getUserActivity,
  getMyProfile,
  updateMyProfile,
  changeMyPassword
};
