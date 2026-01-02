const express = require('express');
const router = express.Router();
const { requireAuth } = require('@clerk/express');
const User = require('../models/User.cjs');
const Chat = require('../models/Chat.cjs');



// Get user statistics
router.get('/user/stats', requireAuth(), async (req, res) => {
    try {
        // Get user ID from Clerk
        const userId = req.auth.userId;
        
        // Count total chats for this user
        const totalChats = await Chat.countDocuments({ userId });
        
        
        const timeSaved = `${Math.floor(totalChats * 0.5)} hours`; 
        
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
router.put('/user/profile', requireAuth(), async (req, res) => {
    try {
        const userId = req.auth.userId;
        const { username, avatarStyle } = req.body;
        
        const updateData = { clerkUserId: userId };
        if (username) updateData.username = username;
        if (avatarStyle) updateData.avatarStyle = avatarStyle;
        
        const updatedUser = await User.findOneAndUpdate(
            { clerkUserId: userId },
            { $set: updateData },
            { new: true, upsert: true, setDefaultsOnInsert: true }
        );
        
        res.json({
            success: true,
            user: {
                id: updatedUser.clerkUserId,
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