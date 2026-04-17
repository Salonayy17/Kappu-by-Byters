const requestLogger = (req, res, next) => {
    console.log(`[REQ] ${new Date().toISOString()} | ${req.method} ${req.url}`);
    next();
};

module.exports = { requestLogger };
