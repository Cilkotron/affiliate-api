const router = require('express').Router();
const {
    createConversion,
    getConversions,
    getMyConversions,
    updateConversionStatus,
} = require('../controllers/conversionsController');
const { authenticate, authorizeAdmin } = require('../middleware/auth.ts');

router.post('/', createConversion);                                         // public
router.get('/', authenticate, authorizeAdmin, getConversions);              // admin
router.get('/affiliate', authenticate, getMyConversions);                   // affiliate
router.put('/:id/status', authenticate, authorizeAdmin, updateConversionStatus); // admin approve/paid

module.exports = router;