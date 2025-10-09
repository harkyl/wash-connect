const express = require('express');
const multer = require('multer');
const path = require('path');
const router = express.Router();
const userAvatarUploadController = require('../Controller/userAvatarUploadController');

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/avatars/');
  },
  filename: function (req, file, cb) {
    cb(null, `user_${req.params.id}_${Date.now()}${path.extname(file.originalname)}`);
  }
});
const upload = multer({ storage });

router.post('/users/:id/avatar', upload.single('file'), userAvatarUploadController.uploadUserAvatar);

module.exports = router;
