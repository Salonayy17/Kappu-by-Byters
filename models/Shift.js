const mongoose = require('mongoose');

const ShiftSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    oldUserId: { type: Number },
    startTime: { type: Date, default: Date.now },
    endTime: { type: Date },
    active: { type: Boolean, default: true },
    plan: { type: String },
    cost: { type: Number }
}, { timestamps: true });

module.exports = mongoose.model('Shift', ShiftSchema);
