const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const User = require('../models/User');

router.get('/signin', authController.getSignIn);
router.post('/signin', authController.postSignIn);
router.get('/register', authController.getRegister);
router.post('/register', authController.postRegister);
router.get('/logout', authController.logout);
router.get('/profile', authController.getProfile);
router.post('/profile', authController.updateProfile);
router.get('/check-users', async (req, res) => {
    try {
        const users = await User.find({});
        res.json(users);
    } catch (error) {
        console.error('Error fetching users:', error);
        res.status(500).json({ error: 'Error fetching users' });
    }
});

module.exports = router;
