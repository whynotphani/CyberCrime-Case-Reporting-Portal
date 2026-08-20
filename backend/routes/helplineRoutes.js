const express = require('express');
const router = express.Router();
const helplineController = require('../controllers/helplineController');

router.post('/create-case', helplineController.createCase);
router.post('/resend-otp', helplineController.resendOtp);

module.exports = router;
