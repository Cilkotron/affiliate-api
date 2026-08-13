import { Router, Request, Response } from 'express';
const router: Router = Router();

import {
    joinProgram,
    leaveProgram,
    getMyPrograms,
    getAllAffiliatePrograms,
} from '../controllers/affiliateProgramsController';
import { authenticate, authorizeAdmin } from '../middleware/auth';

/**
 * @swagger
 * /affiliate-programs/join/{program_id}:
 *   post:
 *     summary: Join a program
 *     tags: [Affiliate Programs]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: program_id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       201:
 *         description: Successfully joined program
 *       403:
 *         description: Affiliate not found or not approved
 *       404:
 *         description: Program not found or inactive
 *       409:
 *         description: Already joined this program
 *       401:
 *         description: Unauthorized
 */
router.post(
    '/join/:program_id',
    authenticate,
    (req: Request, res: Response) => {
        return joinProgram(req, res);
    }
);

/**
 * @swagger
 * /affiliate-programs/leave/{program_id}:
 *   delete:
 *     summary: Leave a program
 *     tags: [Affiliate Programs]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: program_id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Left program successfully
 *       404:
 *         description: Affiliate not found or not joined this program
 *       401:
 *         description: Unauthorized
 */
router.delete(
    '/leave/:program_id',
    authenticate,
    (req: Request, res: Response) => {
        return leaveProgram(req, res);
    }
);

/**
 * @swagger
 * /affiliate-programs:
 *   get:
 *     summary: Get my programs
 *     tags: [Affiliate Programs]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of programs the affiliate has joined
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: integer
 *                   program_id:
 *                     type: integer
 *                   name:
 *                     type: string
 *                   description:
 *                     type: string
 *                   commission_rate:
 *                     type: string
 *                   status:
 *                     type: string
 *                     enum: [active, inactive]
 *                   joined_at:
 *                     type: string
 *       401:
 *         description: Unauthorized
 */
router.get('/', authenticate, (req: Request, res: Response) => {
    return getMyPrograms(req, res);
});

/**
 * @swagger
 * /affiliate-programs/all:
 *   get:
 *     summary: Get all affiliate programs
 *     tags: [Affiliate Programs]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of all affiliate program memberships
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: integer
 *                   joined_at:
 *                     type: string
 *                   first_name:
 *                     type: string
 *                   last_name:
 *                     type: string
 *                   program_name:
 *                     type: string
 *                   commission_rate:
 *                     type: string
 *                   program_status:
 *                     type: string
 *                     enum: [active, inactive]
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Admin access required
 */
router.get(
    '/all',
    authenticate,
    authorizeAdmin,
    (req: Request, res: Response) => {
        return getAllAffiliatePrograms(req, res);
    }
);

export default router;
