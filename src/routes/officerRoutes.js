const express = require('express');
const router = express.Router();
const officerController = require('../controllers/officerController');
const { protect, requireOfficer } = require('../middlewares/authMiddleware');

// All officer routes require valid Officer JWT
router.use(protect, requireOfficer);

// Case Queue & Filtering
router.get('/cases', officerController.getCases);

// Officer list for assignment
router.get('/list', officerController.getOfficerList);

// Specific Case profile
router.get('/cases/:caseNumber', officerController.getCaseByNumber);

// Update status & priority
router.patch('/cases/:caseNumber/status', officerController.updateCaseStatus);

// Assign case to officer
router.patch('/cases/:caseNumber/assign', officerController.assignCase);

// Stream evidence file for officer review
router.get('/evidence/:id/download', officerController.downloadOfficerEvidence);

module.exports = router;
