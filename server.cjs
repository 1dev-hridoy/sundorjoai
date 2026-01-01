const express = require('express');
const path = require('path');
const connectDB = require('./config/database.cjs');

const setupSecurity = require('./middleware/security.cjs');
const setupSession = require('./middleware/session.cjs');
const requestLogger = require('./middleware/logging.cjs');
const { requireAuth } = require('./middleware/auth.cjs');

const indexRoutes = require('./routes/index.cjs');
const authRoutes = require('./routes/auth.cjs');
const chatRoutes = require('./routes/chat.cjs'); // This contains API routes only
const userRoutes = require('./routes/user.cjs');

const app = express();

connectDB().catch(err => {
    console.error('Failed to initialize database connection:', err);
});

// Setup Security Middleware (Helmet, CSP, CORS, Rate Limit)
setupSecurity(app);

// Parse JSON and URL-encoded bodies
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Setup Session (and user locals)
setupSession(app);

// Request logging
app.use(requestLogger);

// Register API routes first to avoid conflicts with catch-all
app.use('/api', userRoutes); // Mount user routes under /api
app.use('/', chatRoutes); // Mount chat API routes (already prefixed with /api)
app.use('/auth', authRoutes);
app.use('/', indexRoutes);

// Special authenticated routes for React frontend - these must be registered before catch-all
app.get('/chat', requireAuth, (req, res) => {
    if (process.env.NODE_ENV === 'production') {
        res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    } else {
        // In development, let React Router handle it via Vite
        res.json({ success: true, message: 'Chat page requested', redirect: '/chat' });
    }
});

app.get('/chat/:chatId', requireAuth, (req, res) => {
    if (process.env.NODE_ENV === 'production') {
        res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    } else {
        // In development, let React Router handle it via Vite
        res.json({ success: true, message: 'Chat page with ID requested', chatId: req.params.chatId });
    }
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Server Error:', err);
    
    // For API routes, return JSON error
    if (req.path.startsWith('/api/')) {
        res.status(500).json({ 
            success: false, 
            error: 'Internal Server Error',
            message: process.env.NODE_ENV === 'production' ? 'An error occurred' : err.message 
        });
        return;
    }
    
    // For frontend routes in production, redirect to error page
    if (process.env.NODE_ENV === 'production') {
        res.status(500).json({ 
            success: false, 
            error: 'Internal Server Error',
            redirect: '/500' 
        });
    } else {
        res.status(500).json({ 
            success: false, 
            error: 'Internal Server Error',
            message: err.message 
        });
    }
});

// Serve static files from the React build directory when in production
if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.join(__dirname, 'dist')));

 
    app.get(/.*/, (req, res) => {
        
        res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
} else {
    // In development, serve from Vite
    app.get('/health', (req, res) => {
        res.json({ status: 'OK', message: 'Server is running in development mode' });
    });
    
    // 404 handler for development
    app.use((req, res) => {
        // For API routes, return JSON 404
        if (req.path.startsWith('/api/')) {
            res.status(404).json({ 
                success: false, 
                error: 'Endpoint not found' 
            });
            return;
        }
        
        res.status(404).json({ 
            success: false, 
            error: 'Page not found' 
        });
    });
}

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});

module.exports = app;