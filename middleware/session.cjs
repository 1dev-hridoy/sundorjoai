const session = require('express-session');
const MongoStore = require('connect-mongo');

const setupSession = (app) => {
    app.use(session({
        secret: process.env.SESSION_SECRET || 'your-secret-key-change-in-production',
        resave: false,
        saveUninitialized: false,
        store: MongoStore.create({
            mongoUrl: process.env.MONGODB_URI || 'mongodb://localhost:27017/prompt2app',
            ttl: 14 * 24 * 60 * 60
        }),
        cookie: {
            secure: process.env.NODE_ENV === 'production' && !process.env.DISABLE_SECURE_COOKIES, // Set DISABLE_SECURE_COOKIES=true for platforms that handle HTTPS termination
            httpOnly: true,
            maxAge: 14 * 24 * 60 * 60 * 1000,
            sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax' // 'none' allows cross-site cookies in production if secure is true
        },
        // Debug logging for session
        proxy: true // Trust first proxy for platforms like Render, Heroku, etc.

    }));


    app.use((req, res, next) => {
        res.locals.user = req.session.userId ? { email: req.session.userEmail, id: req.session.userId } : null;
        next();
    });
};

module.exports = setupSession;