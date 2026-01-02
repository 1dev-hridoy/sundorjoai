const express = require('express');
const path = require('path');
const connectDB = require('./config/database.cjs');

const setupSecurity = require('./middleware/security.cjs');
const setupSession = require('./middleware/session.cjs');
const requestLogger = require('./middleware/logging.cjs');
const { clerkMiddleware } = require('@clerk/express');

const indexRoutes = require('./routes/index.cjs');
const chatRoutes = require('./routes/chat.cjs'); 
const userRoutes = require('./routes/user.cjs');
const contactRoutes = require('./routes/contact.cjs');

const app = express();

connectDB().catch(err => {
    console.error('Failed to initialize database connection:', err);
});


setupSecurity(app);


app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));



app.use(clerkMiddleware({
  secretKey: process.env.CLERK_SECRET_KEY,
  publishableKey: process.env.VITE_CLERK_PUBLISHABLE_KEY || undefined,
}));

// Request logging
app.use(requestLogger);

// Register API routes first to avoid conflicts with catch-all
app.use('/api', userRoutes); 
app.use('/', chatRoutes); 
app.use('/', indexRoutes);


app.use('/api/contact', contactRoutes);

app.get('/chat', (req, res) => {
  
    const isAuthed = req.auth && req.auth.userId;
    if (!isAuthed) {
    
        return res.redirect('/sign-in');
    }
    
    if (process.env.NODE_ENV === 'production') {
        res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    } else {
      
        res.json({ success: true, message: 'Chat page requested', redirect: '/chat' });
    }
});

app.get('/chat/:chatId', (req, res) => {
   
    const isAuthed = req.auth && req.auth.userId;
    if (!isAuthed) {
  
        return res.redirect('/sign-in');
    }
    
    if (process.env.NODE_ENV === 'production') {
        res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    } else {
 
        res.json({ success: true, message: 'Chat page with ID requested', chatId: req.params.chatId });
    }
});


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