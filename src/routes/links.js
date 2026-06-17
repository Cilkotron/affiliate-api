const express = require('express');
const router = express.Router();
const { getLinks, createLink, deleteLink } = require('../controllers/linksController');
const { authenticate, authorizeAdmin } = require('../middleware/auth');

router.get('/', authenticate, authorizeAdmin, getLinks);
router.get('/affiliate', authenticate, getLinks);
router.post('/', authenticate, createLink);
router.delete('/:id', authenticate, authorizeAdmin, deleteLink);
router.delete('/affiliate/:id', authenticate, deleteLink);

module.exports = router;