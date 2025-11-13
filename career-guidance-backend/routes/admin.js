const express = require('express');
const router = express.Router();
const {
  getDashboard,
  getInstitutions,
  getCompanies,
  approveCompany,
  suspendCompany,
  approveInstitution,
  suspendInstitution,
  getUsers,
  getReports,
  updateUser,
  deleteUser
} = require('../controllers/adminController');
const { authenticate, requireRole } = require('../middleware/auth');

// Apply authentication and admin role check to all routes
router.use(authenticate, requireRole(['admin']));

// Dashboard
router.get('/dashboard', getDashboard);

// Institutions
router.get('/institutions', getInstitutions);
router.put('/institutions/:institutionId/approve', approveInstitution);
router.put('/institutions/:institutionId/suspend', suspendInstitution);

// Companies
router.get('/companies', getCompanies);
router.put('/companies/:companyId/approve', approveCompany);
router.put('/companies/:companyId/suspend', suspendCompany);

// Users
router.get('/users', getUsers);
router.put('/users/:userId', updateUser);
router.delete('/users/:userId', deleteUser);

// Reports
router.get('/reports', getReports);

module.exports = router;