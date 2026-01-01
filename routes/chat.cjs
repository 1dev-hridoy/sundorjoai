const express = require('express');
const router = express.Router();
const upload = require('../middleware/upload.cjs');
const { requireAuth } = require('../middleware/auth.cjs');
const chatController = require('../controllers/chatController.cjs');

// Helper function to generate unique chat ID
function generateChatId() {
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}

// Protected chat route - redirect to new chat or load existing
router.get('/chat', requireAuth, chatController.redirectChat);

// Protected chat route with chatId
router.get('/chat/:chatId', requireAuth, chatController.renderChat);

// API route to get all chats for a user
router.get('/api/chats', requireAuth, chatController.getAllChats);

// API route to get chat messages
router.get('/api/chat/:chatId/messages', requireAuth, chatController.getMessages);

// Protected API route for chat
router.post('/api/chat/:chatId', requireAuth, upload.single('image'), chatController.handleChatRequest);

module.exports = router;