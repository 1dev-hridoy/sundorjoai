const helmet = require('helmet');
const cors = require('cors');
const rateLimit = require('express-rate-limit');

const setupSecurity = (app) => {

    app.use(helmet({
        contentSecurityPolicy: {
            useDefaults: false,
            directives: {
                defaultSrc: ["'self'"],
                styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com", "https://*.clerk.dev", "https://*.clerk.accounts.dev", "https://clerk.sundorjoai.scriptysphere.com"],
                fontSrc: ["'self'", "https://fonts.gstatic.com", "https://*.clerk.dev", "https://*.clerk.accounts.dev", "https://clerk.sundorjoai.scriptysphere.com"],
                imgSrc: ["'self'", "data:", "https:", "https://*.clerk.dev", "https://*.clerk.accounts.dev", "https://clerk-telemetry.com", "https://clerk.sundorjoai.scriptysphere.com"],
                scriptSrc: ["'self'", "https://*.clerk.dev", "https://*.clerk.accounts.dev", "https://clerk.sundorjoai.scriptysphere.com"],
                scriptSrcElem: ["'self'", "https://*.clerk.dev", "https://*.clerk.accounts.dev", "https://clerk.sundorjoai.scriptysphere.com"],
                scriptSrcAttr: ["'self'", "https://*.clerk.dev", "https://*.clerk.accounts.dev", "https://clerk.sundorjoai.scriptysphere.com"],
                workerSrc: ["'self'", "blob:", "https://*.clerk.dev", "https://*.clerk.accounts.dev", "https://clerk.sundorjoai.scriptysphere.com"],
                connectSrc: ["'self'", "https://syntexcore.site", "https://syntexcore.onrender.com", "https://*.clerk.dev", "https://*.clerk.accounts.dev", "wss://*.clerk.dev", "wss://*.clerk.accounts.dev", "https://clerk-telemetry.com", "https://clerk.sundorjoai.scriptysphere.com"],
                frameSrc: ["'self'", "https://*.clerk.dev", "https://*.clerk.accounts.dev", "https://clerk.sundorjoai.scriptysphere.com"],
                mediaSrc: ["'self'", "https://*.clerk.dev", "https://*.clerk.accounts.dev", "https://clerk.sundorjoai.scriptysphere.com"],
                objectSrc: ["'none'"], // Prevents loading of plugins like Flash
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

    // Rate limiting - More permissive limits to avoid issues for new users
    const limiter = rateLimit({
        windowMs: 15 * 60 * 1000, 
        max: process.env.NODE_ENV === 'production' ? 1000 : 100, 
        message: 'Too many requests from this IP, please try again later.',
        standardHeaders: true, 
        legacyHeaders: false, 
    });
    app.use(limiter);
};

module.exports = setupSecurity;