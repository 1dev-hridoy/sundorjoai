const express = require('express');
const path = require('path');
const connectDB = require('./config/database.cjs');

const setupSecurity = require('./middleware/security.cjs');
const setupSession = require('./middleware/session.cjs');
const requestLogger = require('./middleware/logging.cjs');

const indexRoutes = require('./routes/index.cjs');
const authRoutes = require('./routes/auth.cjs');
const chatRoutes = require('./routes/chat.cjs');
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

// Routes
app.use('/', indexRoutes);
app.use('/auth', authRoutes);
app.use('/', chatRoutes); // Mount chat routes at root to match original structure
app.use('/api', userRoutes); // Mount user routes under /api

// Serve static files from the React build directory when in production
if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.join(__dirname, 'dist')));


    app.get(/(.*)/, (req, res) => {
        res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
} else {
    // In development, serve from Vite
    app.get('/health', (req, res) => {
        res.json({ status: 'OK', message: 'Server is running in development mode' });
    });
}

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});

module.exports = app;