const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
    phone: { type: String, required: true, unique: true },
    password: { type: String },
    name: { type: String },
    platform: { type: String },
    city: { type: String },
    zone: { type: String },
    plan: { type: String, default: 'weekly' }
}, { timestamps: true });

module.exports = mongoose.model('User', UserSchema);
