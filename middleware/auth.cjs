const requireAuth = (req, res, next) => {
    if (req.session && req.session.userId) {
        return next();
    }
    
    return res.status(401).json({
        success: false,
        error: 'Authentication required',
        redirect: '/auth/signin'
    });
};

const redirectIfAuthenticated = (req, res, next) => {
    if (req.session && req.session.userId) {
        return res.status(400).json({
            success: false,
            error: 'User already authenticated'
        });
    }
    next();
};

module.exports = {
    requireAuth,
    redirectIfAuthenticated
};