const express = require('express');
const router = express.Router();

const authRoutes = require('./auth');
const programsRoutes = require('./programs');
const affiliatesRoutes = require('./affiliates');


router.use('/auth', authRoutes);
router.use('/programs', programsRoutes);
router.use('/affiliates', affiliatesRoutes);

module.exports = router;
