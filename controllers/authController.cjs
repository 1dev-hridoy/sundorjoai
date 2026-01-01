const User = require('../models/User.cjs');
const { validationResult } = require('express-validator');

exports.signup = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                errors: errors.array().map(err => err.msg)
            });
        }

        const { email, password, username } = req.body;

        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({
                success: false,
                error: 'User with this email already exists'
            });
        }

        const user = new User({ email, password, username });
        await user.save();

        req.session.userId = user._id.toString();
        req.session.userEmail = user.email;
        req.session.username = user.username;
        req.session.avatarStyle = user.avatarStyle;
        req.session.createdAt = user.createdAt;

        res.json({
            success: true,
            message: 'Account created successfully',
            user: { 
                email: user.email,
                id: user._id,
                username: user.username,
                createdAt: user.createdAt,
                avatarStyle: user.avatarStyle
            }
        });
    } catch (error) {
        console.error('Signup error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to create account. Please try again.'
        });
    }
};

exports.signin = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                errors: errors.array().map(err => err.msg)
            });
        }

        const { email, password } = req.body;

        const user = await User.findOne({ email }).select('+password');
        if (!user) {
            return res.status(401).json({
                success: false,
                error: 'Invalid email or password'
            });
        }

        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            return res.status(401).json({
                success: false,
                error: 'Invalid email or password'
            });
        }

        // Set session
        req.session.userId = user._id.toString();
        req.session.userEmail = user.email;
        req.session.username = user.username;
        req.session.avatarStyle = user.avatarStyle;
        req.session.createdAt = user.createdAt;

        res.json({
            success: true,
            message: 'Signed in successfully',
            user: { 
                email: user.email,
                id: user._id,
                username: user.username,
                createdAt: user.createdAt,
                avatarStyle: user.avatarStyle
            }
        });
    } catch (error) {
        console.error('Signin error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to sign in. Please try again.'
        });
    }
};

exports.logout = (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            console.error('Logout error:', err);
            return res.status(500).json({
                success: false,
                error: 'Failed to logout'
            });
        }
        res.clearCookie('connect.sid');
        res.json({ success: true, message: 'Logged out successfully' });
    });
};

exports.getCurrentUser = async (req, res) => {
    try {
        if (req.session && req.session.userId) {
            const user = await User.findById(req.session.userId).select('-password');
            if (user) {
                res.json({
                    success: true,
                    user: {
                        email: user.email,
                        id: user._id,
                        username: user.username,
                        createdAt: user.createdAt,
                        avatarStyle: user.avatarStyle
                    }
                });
            } else {
                res.status(401).json({
                    success: false,
                    error: 'User not found'
                });
            }
        } else {
            res.status(401).json({
                success: false,
                error: 'Not authenticated'
            });
        }
    } catch (error) {
        console.error('Get current user error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to get user information'
        });
    }
};