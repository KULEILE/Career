const express = require('express');
const {
  getDashboard,
  getInstitutions,
  getCompanies,
  approveCompany,
  suspendCompany,
  getUsers,
  getReports,
  updateUser,
  deleteUser
} = require('../controllers/adminController');
const { authenticate, requireRole } = require('../middleware/auth');

const router = express.Router();

router.get('/dashboard', authenticate, requireRole(['admin']), getDashboard);
router.get('/institutions', authenticate, requireRole(['admin']), getInstitutions);
router.get('/companies', authenticate, requireRole(['admin']), getCompanies);
router.put('/companies/:companyId/approve', authenticate, requireRole(['admin']), approveCompany);
router.put('/companies/:companyId/suspend', authenticate, requireRole(['admin']), suspendCompany);
router.get('/users', authenticate, requireRole(['admin']), getUsers);
router.put('/users/:userId', authenticate, requireRole(['admin']), updateUser);
router.delete('/users/:userId', authenticate, requireRole(['admin']), deleteUser);
router.get('/reports', authenticate, requireRole(['admin']), getReports);

module.exports = router;