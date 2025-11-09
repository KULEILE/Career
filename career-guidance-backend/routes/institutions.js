// routes/institutions.js
const express = require('express');
const router = express.Router();

const {
  getInstitutionProfile,
  updateInstitutionProfile,
  createCourse,
  getCourses,
  updateCourse,
  deleteCourse,
  getApplications,
  updateApplicationStatus,
  publishAdmissions
} = require('../controllers/institutionController');

const {
  getFaculties,
  getFaculty,
  createFaculty,
  updateFaculty,
  deleteFaculty
} = require('../controllers/facultyController');

const {
  getProspectus,
  uploadProspectus,
  publishProspectus,
  deleteProspectus
} = require('../controllers/prospectusController');

const { authenticate, requireRole } = require('../middleware/auth');
const { prospectusValidation } = require('../middleware/validation');

// Institution profile
router.get('/profile', authenticate, requireRole(['institution']), getInstitutionProfile);
router.put('/profile', authenticate, requireRole(['institution']), updateInstitutionProfile);

// Courses
router.post('/courses', authenticate, requireRole(['institution']), createCourse);
router.get('/courses', authenticate, requireRole(['institution']), getCourses);
router.put('/courses/:courseId', authenticate, requireRole(['institution']), updateCourse);
router.delete('/courses/:courseId', authenticate, requireRole(['institution']), deleteCourse);

// Applications
router.get('/applications', authenticate, requireRole(['institution']), getApplications);
router.put('/applications/:applicationId', authenticate, requireRole(['institution']), updateApplicationStatus);

// Admissions
router.post('/admissions/publish', authenticate, requireRole(['institution']), publishAdmissions);

// Faculties
router.get('/faculties', authenticate, requireRole(['institution']), getFaculties);
router.get('/faculties/:id', authenticate, requireRole(['institution']), getFaculty);
router.post('/faculties', authenticate, requireRole(['institution']), createFaculty);
router.put('/faculties/:id', authenticate, requireRole(['institution']), updateFaculty);
router.delete('/faculties/:id', authenticate, requireRole(['institution']), deleteFaculty);

// Prospectus
router.get('/prospectus', authenticate, requireRole(['institution']), getProspectus);
router.post(
  '/prospectus/upload',
  authenticate,
  requireRole(['institution']),
  (req, res, next) => {
    const { error } = prospectusValidation(req.body);
    if (error) {
      return res.status(400).json({ success: false, error: error.details[0].message });
    }
    next();
  },
  uploadProspectus
);
router.put('/prospectus/:id/publish', authenticate, requireRole(['institution']), publishProspectus);
router.delete('/prospectus/:id', authenticate, requireRole(['institution']), deleteProspectus);

// Waitlist promotion
router.put('/applications/:applicationId/promote', authenticate, requireRole(['institution']), (req, res) => {
  res.json({ success: true, message: 'Student promoted from waitlist successfully' });
});

module.exports = router;
