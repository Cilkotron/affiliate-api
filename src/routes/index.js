const express = require('express');
const router = express.Router();

const authRoutes = require('./auth');
const programsRoutes = require('./programs');

router.use('/auth', authRoutes);
router.use('/programs', programsRoutes);

module.exports = router;
