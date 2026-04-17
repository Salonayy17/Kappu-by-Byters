/**
 * AI/ML fraud scoring simulator
 */
const analyzeMLScore = (userId, claimAmount, zone, wii) => {
    // In production, this would call a Python ML endpoint or use TensorFlow.js
    // Mock ML output
    return Math.floor(Math.random() * 40) + 10; 
};

const getWeightedFraudScore = (ruleScore, mlScore) => {
    // Both are 0-100, we apply weights. E.g., rule is 60%, ML is 40%
    return Math.min(100, Math.round(ruleScore * 0.6 + mlScore * 0.4));
};

module.exports = { analyzeMLScore, getWeightedFraudScore };
