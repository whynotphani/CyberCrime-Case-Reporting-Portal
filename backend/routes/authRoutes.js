const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');

router.post('/citizen/verify-otp', authController.verifyCitizenOtp);
router.post('/officer/login', authController.officerLogin);
router.get('/me', protect, authController.getMe);

module.exports = router;
