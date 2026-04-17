const mongoose = require('mongoose');

const connectDB = async () => {
    try {
        await mongoose.connect('mongodb://localhost:27017/kappu_prod');
        console.log('[DB] MongoDB connected successfully. In-Memory DB acts as fallback.');
    } catch (err) {
        console.warn('[DB] MongoDB connection failed. Continuing with In-Memory DB (Fallback mode).');
    }
};

module.exports = connectDB;
