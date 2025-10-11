const express = require('express');
const router = express.Router();
const customers = require('../Controller/customersController');

router.get('/customers/by-application/:applicationId', customers.getCustomersByApplication);

module.exports = router;