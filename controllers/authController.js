const User = require('../models/User');
const multer = require('multer');
const path = require('path');

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'public/uploads/')
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + path.extname(file.originalname))
    }
});

const upload = multer({ storage: storage });

exports.getSignIn = (req, res) => {
    res.render('signin', { title: 'Sign In' });
};

exports.postSignIn = async (req, res) => {
    const { email, password } = req.body;
    try {
        const user = await User.findOne({ email });
        if (user && await user.comparePassword(password)) {
            req.session.user = { id: user._id, username: user.username };
            return res.redirect('/auth/profile');  // Redirect to profile page
        } else {
            return res.render('signin', { title: 'Sign In', error: 'Invalid email or password' });
        }
    } catch (error) {
        console.error(error);
        return res.render('signin', { title: 'Sign In', error: 'An error occurred' });
    }
};

exports.getRegister = (req, res) => {
    res.render('register', { title: 'Register' });
};

exports.postRegister = async (req, res) => {
    const { username, email, password } = req.body;
    try {
        console.log('Attempting to register user:', { username, email });
        const existingUser = await User.findOne({ $or: [{ email }, { username }] });
        if (existingUser) {
            console.log('User already exists:', existingUser);
            return res.render('register', { title: 'Register', error: 'Username or email already exists' });
        }
        const user = new User({ username, email, password });
        const savedUser = await user.save();
        console.log('User saved successfully:', savedUser);
        req.session.user = { id: savedUser._id, username: savedUser.username };
        return res.redirect('/auth/profile');
    } catch (error) {
        console.error('Error during registration:', error);
        return res.render('register', { title: 'Register', error: 'Registration failed' });
    }
};

exports.logout = (req, res) => {
    req.session.destroy((err) => {
        if (err) console.error('Error destroying session:', err);
        res.redirect('/');
    });
};

exports.getProfile = async (req, res) => {
    if (!req.session.user) {
        return res.redirect('/auth/signin');
    }
    try {
        const user = await User.findById(req.session.user.id);
        if (user) {
            res.render('profile', { title: 'My Account', user });
        } else {
            res.redirect('/auth/signin');
        }
    } catch (error) {
        console.error(error);
        res.redirect('/auth/signin');
    }
};

exports.updateProfile = [
    upload.single('profilePicture'),
    async (req, res) => {
        if (!req.session.user) {
            return res.redirect('/auth/signin');
        }
        try {
            const { email, newPassword } = req.body;
            const user = await User.findById(req.session.user.id);
            if (email) user.email = email;
            if (newPassword) user.password = newPassword;
            if (req.file) {
                user.profilePicture = '/uploads/' + req.file.filename;
            }
            await user.save();
            res.redirect('/auth/profile');
        } catch (error) {
            console.error(error);
            res.render('profile', { title: 'My Account', user: req.session.user, error: 'Update failed' });
        }
    }
];
