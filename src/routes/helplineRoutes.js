const express = require('express');
const router = express.Router();
const helplineController = require('../controllers/helplineController');

// Stage 1: Helpline Operator registers case & generates OTP
router.post('/create-case', helplineController.createCase);

module.exports = router;
