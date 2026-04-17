const express = require('express');
const router = express.Router();

// API Versioning wrapper. We can expose v1 info or mount things here over time.
router.get('/health', (req, res) => res.json({ status: 'ok', service: 'Kāppu API v1', version: '1.0.0' }));

module.exports = router;
