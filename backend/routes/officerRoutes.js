const express = require('express');
const router = express.Router();
const officerController = require('../controllers/officerController');
const { protect, requireOfficer } = require('../middleware/authMiddleware');

router.use(protect, requireOfficer);

router.get('/cases', officerController.getCases);
router.get('/list', officerController.getOfficerList);
router.route('/cases/:caseNumber')
  .get(officerController.getCaseByNumber)
  .delete(officerController.deleteCase);

router.route('/cases/:caseNumber/status')
  .put(officerController.updateCaseStatus)
  .patch(officerController.updateCaseStatus);

router.route('/cases/:caseNumber/assign')
  .put(officerController.assignCase)
  .patch(officerController.assignCase);

router.get('/evidence/:id/download', officerController.downloadOfficerEvidence);

// Super Admin Credential Management Endpoints
router.get('/credentials', officerController.getAllCredentials);
router.post('/credentials', officerController.createOfficerCredential);
router.put('/credentials/:id', officerController.updateOfficerCredential);
router.delete('/credentials/:id', officerController.deleteOfficerCredential);

module.exports = router;
