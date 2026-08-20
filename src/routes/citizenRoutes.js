const express = require('express');
const router = express.Router();
const citizenController = require('../controllers/citizenController');
const { protect, requireCitizen } = require('../middlewares/authMiddleware');
const upload = require('../middlewares/uploadMiddleware');

// All citizen routes require valid Citizen JWT
router.use(protect, requireCitizen);

// Get case profile
router.get('/case', citizenController.getCaseDetails);

// Submit details
router.put('/case/submit', citizenController.submitComplaint);

// Upload evidence
router.post('/case/evidence', upload.array('evidenceFiles', 5), citizenController.uploadEvidence);

// List evidence
router.get('/case/evidence', citizenController.getEvidenceList);

// Download evidence stream
router.get('/case/evidence/:id/download', citizenController.downloadEvidence);

// Get case history timeline
router.get('/case/history', citizenController.getCaseHistory);

module.exports = router;
