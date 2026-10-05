const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/authMiddleware');
const userController = require('../controllers/userController');

// Protected routes
router.use(protect);

// The admin resource console uses these endpoints.
router.get('/me/profile', userController.getMyProfile);
router.put('/me/profile', userController.updateMyProfile);
router.put('/me/password', userController.changeMyPassword);

router.use(authorize('admin'));
router.get('/', userController.getUsers);
router.get('/doctors', userController.getDoctors);
router.get('/:id', userController.getUserById);
router.put('/:id', userController.updateUser);
router.delete('/:id', userController.deleteUser);
router.post('/', userController.createUser);
router.put('/:id/status', userController.updateUserStatus);
router.put('/:id/role', userController.updateUserRole);
router.get('/:id/activity', userController.getUserActivity);

module.exports = router;