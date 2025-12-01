const express = require('express');
const router = express.Router();
const reportController = require('../Controller/reportController');

// POST /api/reports - Create a new report (customer reporting a shop)
router.post('/', reportController.createReport);

// POST /api/reports/customer - Create a new report (owner reporting a customer)
router.post('/customer', reportController.createCustomerReport);

// GET /api/reports/shops/:shopId - Get all reports for a specific shop
router.get('/shops/:shopId', reportController.getReportsByShop);

// PATCH /api/reports/:reportId/resolve - Mark a shop report as resolved
router.patch('/:reportId/resolve', reportController.resolveReport);

// --- Admin Routes for Customer Reports ---

// GET /api/reports/customer - Get all reports made against customers
router.get('/customer', reportController.getCustomerReports);


module.exports = router;