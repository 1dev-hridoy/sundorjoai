const express = require('express');
const router = express.Router();
const upload = require('../middleware/upload.cjs');
const { requireAuth } = require('@clerk/express');
const chatController = require('../controllers/chatController.cjs');


router.get('/api/chats', requireAuth(), chatController.getAllChats);

router.get('/api/chat/:chatId/messages', requireAuth(), chatController.getMessages);

router.post('/api/chat/:chatId', requireAuth(), upload.single('image'), chatController.handleChatRequest);


router.delete('/api/chat/:chatId', requireAuth(), chatController.deleteChat);

module.exports = router;