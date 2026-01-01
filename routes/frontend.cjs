const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/auth.cjs');
const chatController = require('../controllers/chatController.cjs');

// Protected chat route - redirect to new chat or load existing
router.get('/chat', requireAuth, (req, res) => {
    // For React Router to handle, serve the main HTML file
    if (process.env.NODE_ENV === 'production') {
        res.sendFile('index.html', { root: './dist' });
    } else {
        // In development, let Vite handle the routing
        res.json({ 
            success: true, 
            message: 'Chat page requested - handled by React frontend',
            redirect: '/chat'
        });
    }
});

// Protected chat route with chatId
router.get('/chat/:chatId', requireAuth, (req, res) => {
    // For React Router to handle, serve the main HTML file
    if (process.env.NODE_ENV === 'production') {
        res.sendFile('index.html', { root: './dist' });
    } else {
        // In development, let Vite handle the routing
        res.json({ 
            success: true, 
            message: 'Chat page with ID requested - handled by React frontend',
            chatId: req.params.chatId
        });
    }
});

module.exports = router;