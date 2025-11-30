const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const carwashApplicationController = require('../Controller/carwashApplicationController');

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        let uploadPath = path.join(__dirname, '../uploads/');
        if (file.fieldname === 'logo') {
            uploadPath = path.join(__dirname, '../uploads/logos');
        } else if (file.fieldname === 'requirements') {
            uploadPath = path.join(__dirname, '../uploads/requirements');
        }
        cb(null, uploadPath);
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + '-' + file.originalname);
    }
});

const fileFilter = (req, file, cb) => {
    if (file.fieldname === 'requirements') {
        if (file.mimetype === 'application/pdf') {
            cb(null, true);
        } else {
            cb(new Error('Only PDF files are allowed for requirements.'), false);
        }
    } else {
        // For logos, you might want to check for image types
        // For now, we accept any other file for other fields
        cb(null, true);
    }
};

const upload = multer({ storage: storage, fileFilter: fileFilter });

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
router.post('/carwash-applications/:applicationId/logo', upload.single('logo'), carwashApplicationController.updateLogo);

module.exports = router;