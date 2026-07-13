import { Router } from 'express';
import {
    getLinks,
    createLink,
    deleteLink,
} from '../controllers/linksController';
import { authenticate, authorizeAdmin } from '../middleware/auth';

const router = Router();

router.get('/', authenticate, authorizeAdmin, getLinks);
router.get('/affiliate', authenticate, getLinks);

router.post('/', authenticate, createLink);

router.delete('/:id', authenticate, authorizeAdmin, deleteLink);
router.delete('/affiliate/:id', authenticate, deleteLink);

export default router;
