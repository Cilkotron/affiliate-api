const express = require('express');
const router = express.Router();

const authRoutes = require('./auth');
const programsRoutes = require('./programs');
const affiliatesRoutes = require('./affiliates');
const linksRoutes = require('./links');
const clicksRoutes = require('./clicks');


router.use('/auth', authRoutes);
router.use('/programs', programsRoutes);
router.use('/affiliates', affiliatesRoutes);
router.use('/links', linksRoutes);
router.use('/clicks', clicksRoutes);

module.exports = router;
