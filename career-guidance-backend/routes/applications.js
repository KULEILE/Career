const express = require('express');
const {
  createApplication,
  getApplication,
  acceptAdmission
} = require('../controllers/applicationController');
const { authenticate, requireRole } = require('../middleware/auth');

const router = express.Router();

router.post('/', authenticate, requireRole(['student']), createApplication);
router.get('/:applicationId', authenticate, getApplication);
router.post('/:applicationId/accept', authenticate, requireRole(['student']), acceptAdmission);

module.exports = router;