import { Router, Request, Response } from 'express';

const router: Router = Router();

import {
    getAffiliates,
    getAffiliate,
    createAffiliate,
    updateAffiliateStatus,
    deleteAffiliate,
} from '../controllers/affiliatesController';

import { authenticate, authorizeAdmin } from '../middleware/auth';

router.get('/', authenticate, authorizeAdmin, (req: Request, res: Response) => {
    return getAffiliates(req, res);
});

router.get('/:id', authenticate, (req: Request, res: Response) => {
    return getAffiliate(req, res);
});

router.post('/', authenticate, (req: Request, res: Response) => {
    return createAffiliate(req, res);
});

router.put(
    '/:id',
    authenticate,
    authorizeAdmin,
    (req: Request, res: Response) => {
        return updateAffiliateStatus(req, res);
    }
);

router.delete(
    '/:id',
    authenticate,
    authorizeAdmin,
    (req: Request, res: Response) => {
        return deleteAffiliate(req, res);
    }
);

export default router;
