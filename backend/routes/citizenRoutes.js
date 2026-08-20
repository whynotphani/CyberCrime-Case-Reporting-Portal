const express = require('express');
const router = express.Router();
const citizenController = require('../controllers/citizenController');
const { protect, requireCitizen } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

router.use(protect, requireCitizen);

router.get('/case', citizenController.getCaseDetails);
router.put('/case/submit', citizenController.submitComplaint);
router.put('/case/details', citizenController.submitComplaint);
router.post('/case/evidence', upload.array('evidenceFiles', 5), citizenController.uploadEvidence);
router.get('/case/evidence', citizenController.getEvidenceList);
router.get('/case/evidence/:id/download', citizenController.downloadEvidence);
router.get('/case/history', citizenController.getCaseHistory);

module.exports = router;
