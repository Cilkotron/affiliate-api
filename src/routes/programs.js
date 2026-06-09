const express = require('express');
const router = express.Router();
const {
    getPrograms,
    getProgram,
    createProgram,
    updateProgram,
    deleteProgram,
} = require('../controllers/programsController');
const { authenticate, authorizeAdmin } = require('../middleware/auth');

router.get('/', authenticate, getPrograms);
router.get('/:id', authenticate, getProgram);
router.post('/', authenticate, authorizeAdmin, createProgram);
router.put('/:id', authenticate, authorizeAdmin, updateProgram);
router.delete('/:id', authenticate, authorizeAdmin, deleteProgram);

module.exports = router;
