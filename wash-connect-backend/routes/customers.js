const express = require('express');
const router = express.Router();
const customerController = require('../Controller/customersController');

// GET /api/customers/by-application/:applicationId
router.get('/by-application/:applicationId', customerController.getCustomersByApplication);

module.exports = router;