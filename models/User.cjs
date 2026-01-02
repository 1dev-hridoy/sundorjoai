const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    clerkUserId: {
        type: String,
        required: true,
        unique: true,
        index: true
    },
    username: {
        type: String,
        required: false,
        trim: true,
        maxlength: [50, 'Username cannot exceed 50 characters'],
        minlength: [2, 'Username must be at least 2 characters long']
    },
    avatarStyle: {
        type: String,
        default: 'micah'
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

userSchema.pre('save', function (next) {
    this.updatedAt = Date.now();
    next();
});

module.exports = mongoose.model('User', userSchema);