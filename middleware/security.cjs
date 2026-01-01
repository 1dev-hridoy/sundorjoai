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
        origin: (origin, callback) => {
            // Allow requests with no origin (like mobile apps or curl requests)
            if (!origin) return callback(null, true);

            // In production, we want to allow our own domain.
            // Since we are serving frontend from same backend, we can allow the origin if it matches.
            // Or we can trust FRONTEND_URL if set.
            const allowedOrigins = [process.env.FRONTEND_URL, 'http://localhost:5173', 'https://sundorjo-ai.onrender.com'];

            // Also allow the current origin of the request if it's the same site
            if (process.env.NODE_ENV === 'production') {
                callback(null, true); // Since it is same domain mostly
            } else {
                if (allowedOrigins.indexOf(origin) !== -1 || !origin) {
                    callback(null, true);
                } else {
                    callback(new Error('Not allowed by CORS'));
                }
            }
        },
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