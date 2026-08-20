const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { protect } = require('../middlewares/authMiddleware');

// Stage 2: Citizen OTP verification
router.post('/citizen/verify-otp', authController.verifyCitizenOtp);

// Stage 4: Officer Login
router.post('/officer/login', authController.officerLogin);

// Current User Profile Verification
router.get('/me', protect, authController.getMe);

module.exports = router;
