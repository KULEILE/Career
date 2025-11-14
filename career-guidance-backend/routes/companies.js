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

// All routes require company role
router.use(authenticate);
router.use(requireRole(['company']));

// Company profile routes
router.get('/profile', getCompanyProfile);
router.put('/profile', updateCompanyProfile);

// Job management routes
router.post('/jobs', createJob);
router.get('/jobs', getJobs);
router.get('/jobs/:jobId/applicants', getApplicants);
router.get('/jobs/:jobId/qualified-applicants', getQualifiedApplicants);

// Candidate management routes
router.get('/candidates/interview-ready', getInterviewReadyCandidates);
router.put('/applications/:applicationId/status', updateApplicationStatus);

// Dashboard route
router.get('/dashboard', getCompanyDashboard);

module.exports = router;