const mongoose = require('mongoose');

const FraudLogSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    oldUserId: { type: Number },
    ruleScore: { type: Number },
    mlScore: { type: Number },
    finalScore: { type: Number },
    verdict: { type: String },
    checks: { type: Array, default: [] }
}, { timestamps: true });

module.exports = mongoose.model('FraudLog', FraudLogSchema);
