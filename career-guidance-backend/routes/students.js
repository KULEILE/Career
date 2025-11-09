const express = require('express');
const { 
  getStudentProfile,
  updateStudentProfile,
  getStudentApplications,
  uploadTranscript,
  uploadCertificate,
  getAdmissions,
  getAvailableJobs,
  getStudentDocuments,
  acceptAdmissionOffer,
  getStudentDashboard,
  deleteApplication,
  deleteDocument,
  applyForCourse,
  markStudiesCompleted,
  uploadFinalTranscript,
  getJobRecommendations,
  applyForJob,
  getStudentJobApplications
} = require('../controllers/studentController');
const { authenticate, requireRole } = require('../middleware/auth');

const router = express.Router();

router.get('/dashboard', authenticate, requireRole(['student']), getStudentDashboard);
router.get('/profile', authenticate, requireRole(['student']), getStudentProfile);
router.put('/profile', authenticate, requireRole(['student']), updateStudentProfile);
router.get('/applications', authenticate, requireRole(['student']), getStudentApplications);
router.post('/applications/apply', authenticate, requireRole(['student']), applyForCourse);
router.delete('/applications/:applicationId', authenticate, requireRole(['student']), deleteApplication);
router.get('/admissions', authenticate, requireRole(['student']), getAdmissions);
router.post('/admissions/accept', authenticate, requireRole(['student']), acceptAdmissionOffer);
router.get('/jobs', authenticate, requireRole(['student']), getAvailableJobs);
router.get('/jobs/recommendations', authenticate, requireRole(['student']), getJobRecommendations);
router.post('/jobs/apply', authenticate, requireRole(['student']), applyForJob);
router.get('/jobs/applications', authenticate, requireRole(['student']), getStudentJobApplications);
router.get('/documents', authenticate, requireRole(['student']), getStudentDocuments);
router.post('/transcript', authenticate, requireRole(['student']), uploadTranscript);
router.post('/transcript/final', authenticate, requireRole(['student']), uploadFinalTranscript);
router.post('/certificates', authenticate, requireRole(['student']), uploadCertificate);
router.post('/studies/completed', authenticate, requireRole(['student']), markStudiesCompleted);
router.delete('/documents/:id', authenticate, requireRole(['student']), deleteDocument);

module.exports = router;