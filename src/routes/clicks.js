const router = require('express').Router();
const { trackClick, getClicks, getMyClicks } = require('../controllers/clicksController');
const { authenticate, authorizeAdmin } = require('../middleware/auth');

router.get('/go/:slug', trackClick);
router.get('/', authenticate, authorizeAdmin, getClicks);
router.get('/affiliate', authenticate, getMyClicks);

module.exports = router;