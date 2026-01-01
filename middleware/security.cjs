const helmet = require('helmet');
const cors = require('cors');
const rateLimit = require('express-rate-limit');

const setupSecurity = (app) => {

    app.use(helmet({
        contentSecurityPolicy: {
            directives: {
                defaultSrc: ["'self'"],
                styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
                fontSrc: ["'self'", "https://fonts.gstatic.com"],
                imgSrc: ["'self'", "data:", "https:"],
                scriptSrc: ["'self'"],
                connectSrc: ["'self'", "https://syntexcore.site", "https://syntexcore.onrender.com"],
            },
        },
    }));


    app.use(cors({
        origin: process.env.NODE_ENV === 'production'
            ? process.env.FRONTEND_URL
            : 'http://localhost:5173',
        credentials: true,
        optionsSuccessStatus: 200
    }));

    // Rate limiting
    const limiter = rateLimit({
        windowMs: 15 * 60 * 1000,
        max: 100,
        message: 'Too many requests from this IP, please try again later.'
    });
    app.use(limiter);
};

module.exports = setupSecurity;