const router = require('express').Router();
const {
    joinProgram,
    leaveProgram,
    getMyPrograms,
    getAllAffiliatePrograms,
} = require('../controllers/affiliateProgramsController');
const { authenticate, authorizeAdmin } = require('../middleware/auth');

router.post('/join/:program_id', authenticate, joinProgram);
router.delete('/leave/:program_id', authenticate, leaveProgram);
router.get('/', authenticate, getMyPrograms);
router.get('/all', authenticate, authorizeAdmin, getAllAffiliatePrograms);

module.exports = router;