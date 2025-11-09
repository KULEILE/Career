const express = require('express');
const {
  getAllJobs,
  getJob,
  applyForJob
} = require('../controllers/jobController');
const { authenticate, requireRole } = require('../middleware/auth');

const router = express.Router();

router.get('/', getAllJobs);
router.get('/:jobId', getJob);
router.post('/:jobId/apply', authenticate, requireRole(['student']), applyForJob);

module.exports = router;