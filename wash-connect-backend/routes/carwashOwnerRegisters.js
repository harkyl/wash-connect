const express = require('express');
const router = express.Router();
const multer = require('multer');
const upload = multer({ dest: 'uploads/avatars/' });
const carwashOwnerRegisterController = require('../Controller/carwashOwnerRegister');

// Real-time availability check endpoints (must be before the register route)
router.get('/check-owner-id/:id', carwashOwnerRegisterController.checkOwnerId);
router.get('/check-email/:email', carwashOwnerRegisterController.checkEmail);

// Registration endpoint
router.post('/register-carwash-owner', upload.single('avatar'), carwashOwnerRegisterController.registerCarwashOwner);

module.exports = router;