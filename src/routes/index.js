const router = require('express').Router();

const authRoutes = require('./auth');
const programsRoutes = require('./programs');
const affiliatesRoutes = require('./affiliates');
const affiliateProgramsRoutes = require('./affiliatePrograms');
const linksRoutes = require('./links');
const clicksRoutes = require('./clicks');
const conversionsRoutes = require('./conversions');


router.use('/auth', authRoutes);
router.use('/programs', programsRoutes);
router.use('/affiliates', affiliatesRoutes);
router.use('/affiliate-programs', affiliateProgramsRoutes);
router.use('/links', linksRoutes);
router.use('/clicks', clicksRoutes);
router.use('/conversions', conversionsRoutes);

module.exports = router;
