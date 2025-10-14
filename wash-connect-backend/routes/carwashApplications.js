const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const carwashApplicationController = require('../Controller/carwashApplicationController');

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, path.join(__dirname, '../uploads/logos'));
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + '-' + file.originalname);
    }
});
const upload = multer({ storage: storage });

router.post(
    '/carwash-applications',
    upload.fields([
        { name: 'logo', maxCount: 1 },
        { name: 'requirements', maxCount: 1 }
    ]),
    carwashApplicationController.submitApplication
);

router.get('/carwash-applications/status/:ownerId', carwashApplicationController.getApplicationStatus);
router.get('/carwash-applications/by-owner/:ownerId', carwashApplicationController.getApplicationByOwner);
router.get('/carwash-applications/by-application/:applicationId', carwashApplicationController.getApplicationById);
// Optional: alternate path
router.get('/applications/:id', carwashApplicationController.getApplicationById);
router.get('/carwash-applications/approved', carwashApplicationController.getApprovedApplications);
router.get('/carwash-applications/approved-with-appointments', carwashApplicationController.getApprovedWithAppointments);

module.exports = router;