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

/**
 * @swagger
 * /affiliates:
 *   get:
 *     summary: Get all affiliates
 *     tags: [Affiliates]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *           maximum: 100
 *         description: Items per page
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending, approved, rejected]
 *         description: Filter by status
 *     responses:
 *       200:
 *         description: Paginated list of affiliates
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                       user_id:
 *                         type: integer
 *                       first_name:
 *                         type: string
 *                       last_name:
 *                         type: string
 *                       website:
 *                         type: string
 *                       status:
 *                         type: string
 *                         enum: [pending, approved, rejected]
 *                       email:
 *                         type: string
 *                       created_at:
 *                         type: string
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     page:
 *                       type: integer
 *                     limit:
 *                       type: integer
 *                     total:
 *                       type: integer
 *                     totalPages:
 *                       type: integer
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Admin access required
 */
router.get('/', authenticate, authorizeAdmin, (req: Request, res: Response) => {
    return getAffiliates(req, res);
});

/**
 * @swagger
 * /affiliates/{id}:
 *   get:
 *     summary: Get affiliate by ID
 *     tags: [Affiliates]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Affiliate found
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Affiliate not found
 */
router.get('/:id', authenticate, (req: Request, res: Response) => {
    return getAffiliate(req, res);
});

/**
 * @swagger
 * /affiliates:
 *   post:
 *     summary: Create affiliate profile
 *     tags: [Affiliates]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - first_name
 *               - last_name
 *             properties:
 *               first_name:
 *                 type: string
 *                 example: John
 *               last_name:
 *                 type: string
 *                 example: Doe
 *               website:
 *                 type: string
 *                 example: https://johndoe.com
 *     responses:
 *       201:
 *         description: Affiliate created
 *       400:
 *         description: Affiliate profile already exists
 *       401:
 *         description: Unauthorized
 */
router.post('/', authenticate, (req: Request, res: Response) => {
    return createAffiliate(req, res);
});

/**
 * @swagger
 * /affiliates/{id}:
 *   put:
 *     summary: Update affiliate status
 *     tags: [Affiliates]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - status
 *               - version
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [pending, approved, rejected]
 *                 example: approved
 *               version:
 *                 type: integer
 *                 example: 1
 *     responses:
 *       200:
 *         description: Status updated
 *       400:
 *         description: Invalid status or missing version
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Admin access required
 *       404:
 *         description: Affiliate not found
 *       409:
 *         description: Affiliate was modified by another request
 */
router.put(
    '/:id',
    authenticate,
    authorizeAdmin,
    (req: Request, res: Response) => {
        return updateAffiliateStatus(req, res);
    }
);

/**
 * @swagger
 * /affiliates/{id}:
 *   delete:
 *     summary: Delete affiliate
 *     tags: [Affiliates]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Affiliate deleted successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Admin access required
 *       404:
 *         description: Affiliate not found
 */
router.delete(
    '/:id',
    authenticate,
    authorizeAdmin,
    (req: Request, res: Response) => {
        return deleteAffiliate(req, res);
    }
);

export default router;
