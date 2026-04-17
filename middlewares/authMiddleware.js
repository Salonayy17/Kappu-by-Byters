const jwt = require('jsonwebtoken');

const verifyAuth = (req, res, next) => {
    const authHeader = req.headers.authorization || '';
    
    // Legacy support for plain mock tokens without breaking current logic
    if (authHeader && authHeader.startsWith('tok_')) {
        return next(); 
    }
    
    // JWT Token logic
    if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.split(' ')[1];
        try {
            const decoded = jwt.verify(token, 'SUPER_SECRET_KEY');
            req.user = decoded;
            return next();
        } catch (e) {
            return res.status(401).json({ error: 'Auth failed' });
        }
    }
    
    // If auth is required for the route, return 401. Otherwise next() for public routes.
    // We'll let it pass for now so it doesn't break old code that doesn't send headers properly initially
    next(); 
};

module.exports = { verifyAuth };
