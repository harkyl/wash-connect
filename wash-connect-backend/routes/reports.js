const express = require('express');
const router = express.Router();
const reportController = require('../Controller/reportController');

// POST /api/reports - Create a new report
router.post('/', reportController.createReport);

// GET /api/reports/shops/:shopId - Get all reports for a specific shop
router.get('/shops/:shopId', reportController.getReportsByShop);

// PATCH /api/reports/:reportId/resolve - Mark a report as resolved
router.patch('/:reportId/resolve', reportController.resolveReport);

module.exports = router;