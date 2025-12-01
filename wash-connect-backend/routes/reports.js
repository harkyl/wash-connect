const express = require('express');
const router = express.Router();
const reportController = require('../Controller/reportController');

// POST /api/reports - Create a new report
router.post('/', reportController.createReport);

module.exports = router;