const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const authController = require('../controllers/authController');

// Public routes
router.post('/register', authController.register);
router.post('/login', authController.login);
router.post('/logout', protect, authController.logout);
router.post('/refresh-token', authController.refreshToken);
router.get('/me', protect, authController.getMe);
router.put('/update-profile', protect, authController.updateProfile);
router.put('/change-password', protect, authController.changePassword);
router.post('/forgot-password', authController.forgotPassword);
router.put('/reset-password/:token', authController.resetPassword);

module.exports = router;