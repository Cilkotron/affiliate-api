const express = require('express');
const router = express.Router();
const {
  getAffiliates,
  getAffiliate,
  createAffiliate,
  updateAffiliateStatus,
  deleteAffiliate,
} = require('../controllers/affiliatesController');
const { authenticate, authorizeAdmin } = require('../middleware/auth');

router.get('/', authenticate, authorizeAdmin, getAffiliates);
router.get('/:id', authenticate, getAffiliate);
router.post('/', authenticate, createAffiliate);
router.put('/:id', authenticate, authorizeAdmin, updateAffiliateStatus);
router.delete('/:id', authenticate, authorizeAdmin, deleteAffiliate);

module.exports = router;