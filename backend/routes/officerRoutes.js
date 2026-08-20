const express = require('express');
const router = express.Router();
const officerController = require('../controllers/officerController');
const { protect, requireOfficer } = require('../middleware/authMiddleware');

router.use(protect, requireOfficer);

router.get('/cases', officerController.getCases);
router.get('/list', officerController.getOfficerList);
router.get('/cases/:caseNumber', officerController.getCaseByNumber);
router.patch('/cases/:caseNumber/status', officerController.updateCaseStatus);
router.patch('/cases/:caseNumber/assign', officerController.assignCase);
router.get('/evidence/:id/download', officerController.downloadOfficerEvidence);

module.exports = router;
