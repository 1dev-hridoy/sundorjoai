const express = require('express');
const router = express.Router();
const Contact = require('../models/Contact.cjs');




router.post('/submit', async (req, res) => {
    try {
        const { name, email, message } = req.body;



        const newContact = new Contact({
            name,
            email,
            message
        });

      
        
        await newContact.save();

        res.status(200).json({
            success: true,
            message: 'Message submitted successfully'
        });
    } catch (error) {
        console.error('Error submitting contact form:', error);
        
      
        

        if (error.name === 'ValidationError') {
            const messages = Object.values(error.errors).map(err => err.message);
            return res.status(400).json({
                success: false,
                message: messages.join(', ')
            });
        }

        
        
        res.status(500).json({
            success: false,
            message: 'Failed to submit message. Please try again.'
        });
    }
});

module.exports = router;