const express = require('express');
const { checkEligibility } = require('../controllers/eligibilityController');

const router = express.Router();

router.post('/check', checkEligibility);

module.exports = router;