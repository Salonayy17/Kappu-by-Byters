const mongoose = require('mongoose');

const ClaimSchema = new mongoose.Schema({
    claimId: { type: String },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    oldUserId: { type: Number },
    date: { type: String },
    type: { type: String },
    icon: { type: String },
    amount: { type: Number },
    status: { type: String, default: 'processing' },
    wii: { type: Number },
    upiId: { type: String },
    txnId: { type: String },
    fraudScore: { type: Number }
}, { timestamps: true });

module.exports = mongoose.model('Claim', ClaimSchema);
