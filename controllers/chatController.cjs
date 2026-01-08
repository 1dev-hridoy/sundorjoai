const Chat = require('../models/Chat.cjs');
const chalk = require('chalk').default || require('chalk');
const { generateSyntexResponse, generateContextSummary } = require('../utils/syntexCore.cjs');
const { uploadToCloudinary } = require('../utils/cloudinary.cjs');

function generateChatId() {
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}

exports.redirectChat = async (req, res) => {
    const chatId = req.query.chatId || generateChatId();
    res.json({ redirect: `/chat/${chatId}` });
};

exports.renderChat = async (req, res) => {
    try {
        const { chatId } = req.params;

        const userId = req.auth.userId;

        // Find or create chat
        let chat = await Chat.findOne({ chatId, userId });

        if (!chat) {
            chat = new Chat({
                chatId,
                userId,
                title: 'New Chat',
                messages: []
            });
            await chat.save();
        }

        res.json({
            success: true,
            chatId: chat.chatId,
            messages: chat.messages,
            user: { id: userId }
        });
    } catch (error) {
        console.error('Chat route error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to load chat',
            chatId: req.params.chatId
        });
    }
};

exports.getMessages = async (req, res) => {
    try {
        const { chatId } = req.params;
        const userId = req.auth.userId;

        const chat = await Chat.findOne({ chatId, userId });
        if (!chat) {
            return res.json({ success: true, messages: [] });
        }

        res.json({ success: true, messages: chat.messages });
    } catch (error) {
        console.error('Get messages error:', error);
        res.status(500).json({ success: false, error: 'Failed to load messages' });
    }
};

// New function to get all chat sessions for a user
exports.getAllChats = async (req, res) => {
    try {
        const userId = req.auth.userId;

        const chats = await Chat.find({ userId })
            .select('chatId title createdAt updatedAt')
            .sort({ updatedAt: -1 });

        const sessions = chats.map(chat => ({
            id: chat.chatId,
            title: chat.title,
            date: chat.updatedAt ? new Date(chat.updatedAt).toLocaleDateString() : 'Unknown',
            createdAt: chat.createdAt ? new Date(chat.createdAt).toISOString() : new Date().toISOString()
        }));

        res.json({
            success: true,
            sessions
        });
    } catch (error) {
        console.error('Get all chats error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to load chat sessions'
        });
    }
};


exports.deleteChat = async (req, res) => {
    try {
        const { chatId } = req.params;




        const userId = req.auth.userId;


        const result = await Chat.findOneAndDelete({ chatId, userId });

        if (!result) {
            return res.status(404).json({
                success: false,
                error: 'Chat not found or you do not have permission to delete it'
            });
        }

        res.json({
            success: true,
            message: 'Chat deleted successfully'
        });
    } catch (error) {
        console.error('Delete chat error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to delete chat'
        });
    }
};

exports.handleChatRequest = async (req, res) => {
    let chatId = req.params.chatId;

    let userId = req.auth.userId;
    const userText = req.body.text || '';
    const imageFile = req.file;

    console.log(chalk.blue(`[${new Date().toISOString()}]`) + chalk.yellow(' Chat request received for chatId: ') + chalk.magenta(chatId));
    try {
        // Check authentication
        if (!userId) {
            return res.status(401).json({ success: false, error: 'Not authenticated', redirect: '/sign-in' });
        }
        console.log('--- DETAILED REQUEST LOG START ---');
        console.log('Time:', new Date().toISOString());
        console.log('Chat ID:', chatId);
        console.log('User ID:', userId);
        console.log('Text Length:', userText.length);
        if (imageFile) {
            console.log('Image Info:', {
                originalname: imageFile.originalname,
                mimetype: imageFile.mimetype,
                size: imageFile.size
            });
        }
        console.log('Headers:', JSON.stringify(req.headers, null, 2));

        if (!userText.trim() && !imageFile) {
            console.log('Validation Failed: No text or image');
            return res.status(400).json({ success: false, error: 'Please provide a message or upload an image' });
        }

        let chat = await Chat.findOne({ chatId, userId });
        if (!chat) {
            console.log(`[${new Date().toISOString()}] Creating new chat for chatId: ${chatId}`);
            chat = new Chat({
                chatId,
                userId,
                title: userText.substring(0, 50) || 'New Chat',
                messages: []
            });
        }

        let cloudinaryUrl = null;
        if (imageFile) {
            try {
                console.log(chalk.blue(`[${new Date().toISOString()}]`) + chalk.yellow(' Uploading image...'));
                cloudinaryUrl = await uploadToCloudinary(imageFile.buffer);
                console.log(chalk.blue(`[${new Date().toISOString()}]`) + chalk.green(' Image uploaded to Cloudinary: ') + chalk.cyan(cloudinaryUrl));
            } catch (err) {
                console.error(chalk.blue(`[${new Date().toISOString()}]`) + chalk.red(' CRITICAL: Cloudinary upload failed: ') + chalk.yellow(err.message));
            }
        }

        await chat.addMessage('user', userText || (imageFile ? 'Image uploaded' : ''), cloudinaryUrl || null);

        const conversationHistory = chat.getConversationHistory().slice(-16, -1);

        // SSE Setup
        res.setHeader('Content-Type', 'text/event-stream');
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Connection', 'keep-alive');
        res.flushHeaders();

        const sendEvent = (type, data) => {
            res.write(`data: ${JSON.stringify({ type, ...data })}\n\n`);
        };

        const onThinking = (message) => {
            console.log(chalk.blue(`[SSE Status] `) + chalk.cyan(message));
            sendEvent('status', { message });
        };

        // Generate AI response
        console.log(chalk.blue(`[${new Date().toISOString()}]`) + chalk.yellow(' Calling AI API with parameters:'));
        console.log(chalk.gray('  - User Text: ') + chalk.white(userText.substring(0, 100) + (userText.length > 100 ? '...' : '')));
        console.log(chalk.gray('  - Has Image: ') + chalk[cloudinaryUrl ? 'green' : 'red'](!!cloudinaryUrl));
        console.log(chalk.gray('  - Conversation History Length: ') + chalk.cyan(conversationHistory.length));
        console.log(chalk.gray('  - Chat ID: ') + chalk.magenta(chatId));

        const responseData = await generateSyntexResponse(
            userText,
            cloudinaryUrl,
            conversationHistory,
            onThinking,
            chatId,
            chat.contextSummary || ''
        );

        console.log(chalk.blue(`[${new Date().toISOString()}]`) + chalk.green(' AI API Response received:'));
        console.log(chalk.gray('  - Success: ') + chalk[responseData.success ? 'green' : 'red'](responseData.success));

        await chat.addMessage('assistant', responseData.result);

        // Update chat title if it's still "New Chat"
        if (chat.title === 'New Chat' && userText.trim()) {
            chat.title = userText.substring(0, 50);
            await chat.save();
        }

        sendEvent('result', { success: true, result: responseData.result });
        res.end();

        // Background Task: Update Context Summary
        (async () => {
            try {
                const freshChat = await Chat.findOne({ chatId });
                if (freshChat) {
                    const latestHistory = freshChat.getConversationHistory().slice(-16);
                    const newSummary = await generateContextSummary(latestHistory, freshChat.contextSummary);
                    if (newSummary !== freshChat.contextSummary) {
                        freshChat.contextSummary = newSummary;
                        await freshChat.save();
                        console.log(chalk.magenta(`[Background] Context summary updated for chat ${chatId}`));
                    }
                }
            } catch (bgError) {
                console.error(chalk.red('[Background] Failed to update context summary:'), bgError.message);
            }
        })();

    } catch (error) {
        console.error(chalk.red('--- API ERROR START ---'));
        console.error(chalk.red('Error Type: ') + chalk.yellow(error.constructor.name));
        console.error(chalk.red('Message: ') + chalk.yellow(error.message));
        console.error(chalk.red('Stack: ') + chalk.gray(error.stack));
        console.error(chalk.red('Chat ID: ') + chalk.magenta(chatId));
        console.error(chalk.red('User ID: ') + chalk.magenta(userId));
        console.error(chalk.red('User Text: ') + chalk.white(userText));
        console.error(chalk.red('Has Image: ') + chalk[imageFile ? 'green' : 'red'](!!imageFile));
        if (imageFile) {
            console.error(chalk.red('Image File Info: '));
            console.error(chalk.gray('  - Original Name: ') + chalk.cyan(imageFile.originalname));
            console.error(chalk.gray('  - Size: ') + chalk.yellow(`${imageFile.size} bytes`));
            console.error(chalk.gray('  - MIME Type: ') + chalk.blue(imageFile.mimetype));
        } else {
            console.error(chalk.red('Image File Info: ') + chalk.gray('null'));
        }
        if (error.response) {
            console.error(chalk.red('API Response Status: ') + chalk.yellow(error.response.status));
            console.error(chalk.red('API Response Data: ') + chalk.white(JSON.stringify(error.response.data, null, 2)));
            console.error(chalk.red('API Response Headers: ') + chalk.gray(JSON.stringify(error.response.headers, null, 2)));
        }
        if (error.request) {
            console.error(chalk.red('API Request Details: ') + chalk.gray(JSON.stringify(error.request, null, 2)));
        }

        // Map errors to user-friendly messages
        let userMessage = error.message;
        let statusCode = 500;

        if (error.response?.status === 429) {
            userMessage = 'Dermatological analyzer is busy. Please wait 60 seconds.';
            statusCode = 429;
        } else if (error.response?.status === 400) {
            userMessage = 'The image format or message content could not be processed. Please try a different image.';
        } else if (error.message.includes('All AI models failed')) {
            userMessage = 'Connection to intelligence models failed. Please try again.';
        }

        if (res.headersSent) {
            console.log(chalk.red('SSE Stream Error: ') + chalk.yellow(userMessage));
            sendEvent('error', { success: false, error: userMessage, details: error.message });
            return res.end();
        }

        res.status(statusCode).json({
            success: false,
            error: userMessage,
            details: error.message
        });
    }
};