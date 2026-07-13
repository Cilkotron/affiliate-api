import { Router, Request, Response, NextFunction } from 'express';

import {
    getPrograms,
    getProgram,
    createProgram,
    updateProgram,
    deleteProgram,
} from '../controllers/programsController';

import { authenticate, authorizeAdmin } from '../middleware/auth';

const router: Router = Router();

router.get(
    '/',
    (req: Request, res: Response, next: NextFunction) =>
        authenticate(req, res, next),
    getPrograms
);
router.get(
    '/:id',
    (req: Request, res: Response, next: NextFunction) =>
        authenticate(req, res, next),
    getProgram
);

router.post(
    '/',
    (req: Request, res: Response, next: NextFunction) =>
        authenticate(req, res, next),
    (req: Request, res: Response, next: NextFunction) =>
        authorizeAdmin(req, res, next),
    createProgram
);

router.put(
    '/:id',
    (req: Request, res: Response, next: NextFunction) =>
        authenticate(req, res, next),
    (req: Request, res: Response, next: NextFunction) =>
        authorizeAdmin(req, res, next),
    updateProgram
);

router.delete(
    '/:id',
    (req: Request, res: Response, next: NextFunction) =>
        authenticate(req, res, next),
    (req: Request, res: Response, next: NextFunction) =>
        authorizeAdmin(req, res, next),
    deleteProgram
);

export default router;
