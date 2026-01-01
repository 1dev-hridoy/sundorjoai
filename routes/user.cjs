const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/auth.cjs');
const User = require('../models/User.cjs');
const Chat = require('../models/Chat.cjs');

// All routes are prefixed with /api when mounted in server.cjs
// So these will be accessible as /api/user/stats, /api/user/profile, etc.

// Get user statistics
router.get('/user/stats', requireAuth, async (req, res) => {
    try {
        // Get user ID from session
        const userId = req.session.userId;
        
        // Count total chats for this user
        const totalChats = await Chat.countDocuments({ userId });
        
        // For time saved, we can calculate based on number of chats or other metrics
        // For now, we'll just return a placeholder based on number of chats
        const timeSaved = `${Math.floor(totalChats * 0.5)} hours`; // Assuming 0.5 hours saved per chat
        
        res.json({
            success: true,
            totalChats,
            timeSaved
        });
    } catch (error) {
        console.error('Get user stats error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch user statistics'
        });
    }
});

// Update user profile
router.put('/user/profile', requireAuth, async (req, res) => {
    try {
        const userId = req.session.userId;
        const { username, avatarStyle } = req.body;
        
        const updateData = {};
        if (username) updateData.username = username;
        if (avatarStyle) updateData.avatarStyle = avatarStyle;
        
        const updatedUser = await User.findByIdAndUpdate(
            userId,
            { $set: updateData },
            { new: true, runValidators: true }
        );
        
        if (!updatedUser) {
            return res.status(404).json({
                success: false,
                error: 'User not found'
            });
        }
        
        // Update session data
        if (updatedUser.username) req.session.username = updatedUser.username;
        if (updatedUser.avatarStyle) req.session.avatarStyle = updatedUser.avatarStyle;
        
        res.json({
            success: true,
            user: {
                id: updatedUser._id,
                email: updatedUser.email,
                username: updatedUser.username,
                avatarStyle: updatedUser.avatarStyle,
                createdAt: updatedUser.createdAt
            }
        });
    } catch (error) {
        console.error('Update user profile error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to update user profile'
        });
    }
});

module.exports = router;