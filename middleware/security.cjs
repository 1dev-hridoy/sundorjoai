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
        origin: function (origin, callback) {
            // Allow requests with no origin (like mobile apps or curl requests)
            if (!origin) return callback(null, true);
            
            // In production, allow the same origin as the server is serving the frontend
            if (process.env.NODE_ENV === 'production') {
                // Since frontend is served by the same backend in production, allow same origin
                callback(null, true);
            } else {
                // In development, allow localhost origins
                const allowedOrigins = [process.env.FRONTEND_URL, 'http://localhost:5173', 'https://sundorjo-ai.onrender.com'];
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