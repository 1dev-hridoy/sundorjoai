const express = require('express');
const router = express.Router();
const { createContact } = require('../controllers/contactController.cjs');

router.use(express.static('public'));

router.post('/api/contact', createContact);


router.get('*', (req, res) => {
    res.sendFile('index.html', { root: 'public' });
});

module.exports = router;