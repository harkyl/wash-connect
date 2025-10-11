const express = require('express');
const router = express.Router();
const owner = require('../Controller/ownerController');

router.get('/owners/:id/phone', owner.getOwnerPhone);
router.get('/applications/:applicationId/owner-phone', owner.getOwnerPhoneByApplication);

module.exports = router;