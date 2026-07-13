import { Router, Request, Response } from 'express';
const router: Router = Router();

import {
    joinProgram,
    leaveProgram,
    getMyPrograms,
    getAllAffiliatePrograms,
} from '../controllers/affiliateProgramsController';
import { authenticate, authorizeAdmin } from '../middleware/auth';

router.post('/join/:program_id', authenticate, (req: Request, res: Response) => {
    return joinProgram(req, res);
});
router.delete('/leave/:program_id', authenticate, (req: Request, res: Response) => {
    return leaveProgram(req, res);
});
router.get('/', authenticate, (req: Request, res: Response) => {
    return getMyPrograms(req, res);
});
router.get('/all', authenticate, authorizeAdmin, (req: Request, res: Response) => {
    return getAllAffiliatePrograms(req, res);
});

export default router;