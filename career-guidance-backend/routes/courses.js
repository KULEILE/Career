const express = require('express');
const {
  getAllCourses,
  getCourse,
  getInstitutionCourses,
  createCourse,
  updateCourse,
  deleteCourse
} = require('../controllers/courseController');

const { authenticate, requireRole } = require('../middleware/auth'); // Correct destructuring

const router = express.Router();

// Public GET routes
router.get('/', getAllCourses);
router.get('/:courseId', getCourse);
router.get('/institution/:institutionId', getInstitutionCourses);

// Protected routes (only logged-in institutions can create/update/delete)
router.post('/', authenticate, requireRole(['institution']), createCourse);
router.put('/:courseId', authenticate, requireRole(['institution']), updateCourse);
router.delete('/:courseId', authenticate, requireRole(['institution']), deleteCourse);

module.exports = router;
