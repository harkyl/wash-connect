const express = require('express');
const router = express.Router();
const userController = require('../Controller/userController');

router.post('/register', userController.registerUser);

// Make these relative to the mount path
router.put('/:id', userController.updateUser);
router.patch('/:id', userController.updateUser);

// Ping test
router.get('/ping', (req, res) => res.send('users router mounted'));

module.exports = router;
