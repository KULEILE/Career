const express = require('express');
const {
  getCompanyProfile,
  updateCompanyProfile,
  createJob,
  getJobs,
  getApplicants,
  getQualifiedApplicants,
  getInterviewReadyCandidates,
  getCompanyDashboard,
  updateApplicationStatus
} = require('../controllers/companyController');
const { authenticate, requireRole } = require('../middleware/auth');

const router = express.Router();

router.get('/profile', authenticate, requireRole(['company']), getCompanyProfile);
router.put('/profile', authenticate, requireRole(['company']), updateCompanyProfile);
router.post('/jobs', authenticate, requireRole(['company']), createJob);
router.get('/jobs', authenticate, requireRole(['company']), getJobs);
router.get('/jobs/:jobId/applicants', authenticate, requireRole(['company']), getApplicants);
router.get('/jobs/:jobId/qualified-applicants', authenticate, requireRole(['company']), getQualifiedApplicants);
router.get('/candidates/interview-ready', authenticate, requireRole(['company']), getInterviewReadyCandidates);
router.get('/dashboard', authenticate, requireRole(['company']), getCompanyDashboard);
router.put('/applications/:applicationId/status', authenticate, requireRole(['company']), updateApplicationStatus);

module.exports = router;