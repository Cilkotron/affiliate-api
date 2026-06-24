const router = require('express').Router();
const {
    createPayout,
    getPayouts,
    getMyPayouts,
    updatePayoutStatus,
} = require('../controllers/payoutsController');
const { authenticate, authorizeAdmin } = require('../middleware/auth');

router.post('/', authenticate, createPayout);
router.get('/', authenticate, authorizeAdmin, getPayouts);
router.get('/affiliate', authenticate, getMyPayouts);
router.put('/:id/status', authenticate, authorizeAdmin, updatePayoutStatus);

module.exports = router;