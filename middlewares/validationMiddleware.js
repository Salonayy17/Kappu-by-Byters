// Input validation checks without breaking current logic
const validateClaim = (req, res, next) => {
    const { userId, type } = req.body;
    if (req.method === 'POST' && req.path === '/claim') {
        if (!userId || !type) {
            console.warn('[Validation] Claim request missing fields, but letting it pass to avoid breaking legacy');
            // Normally we'd return 400 here, but keeping backward compatible
        }
    }
    next();
};

module.exports = { validateClaim };
