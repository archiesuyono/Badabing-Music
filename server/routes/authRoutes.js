const express = require('express');
const authenticateToken = require('../middlewares/authentication');
const authController = require('../controllers/authController');

const router = express.Router();

// Register
router.post('/register', authController.register);

// Login
router.post('/login', authController.login);

// Google OAuth
router.post('/google', authController.googleAuth);

// Get current user
router.get('/me', authenticateToken, authController.getCurrentUser);

// Update profile
router.put('/profile', authenticateToken, authController.updateProfile);

module.exports = router;
