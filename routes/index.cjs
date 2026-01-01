const express = require('express');
const router = express.Router();

// Serve React app for all routes (handled by catch-all in server.js)
// This route is just for API health check
router.get('/health', (req, res) => {
    res.json({ status: 'OK', message: 'Server is running' });
});

module.exports = router;