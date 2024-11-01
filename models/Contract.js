const mongoose = require('mongoose');

const ContractSchema = new mongoose.Schema({
    address: { type: String, required: true, unique: true },
    creatorAddress: { type: String, required: true },
    bytecode: { type: String, required: true },
    abi: { type: String },
    name: { type: String },
    sourceCode: { type: String },
    creationTransaction: { type: String },
    creationTimestamp: { type: Date, default: Date.now },
    isVerified: { type: Boolean, default: false },
    lastInteraction: { type: Date },
    tokenType: { type: String }, // e.g., 'ERC20', 'ERC721', etc.
    tags: [{ type: String }], // For categorizing contracts, e.g., 'flash loan', 'DEX', etc.
});

module.exports = mongoose.model('Contract', ContractSchema);
