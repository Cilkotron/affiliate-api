import { Router } from 'express';
import {
    createPayout,
    getPayouts,
    getMyPayouts,
    updatePayoutStatus,
} from '../controllers/payoutsController';
import { authenticate, authorizeAdmin } from '../middleware/auth';

const router = Router();

/**
 * @swagger
 * /payouts:
 *   post:
 *     summary: Request a payout
 *     tags: [Payouts]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - amount
 *             properties:
 *               amount:
 *                 type: number
 *                 example: 50.00
 *               affiliate_id:
 *                 type: integer
 *                 example: 1
 *                 description: Required only for admin
 *     responses:
 *       201:
 *         description: Payout created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: integer
 *                 affiliate_id:
 *                   type: integer
 *                 amount:
 *                   type: string
 *                 status:
 *                   type: string
 *                   enum: [pending, paid]
 *                 paid_at:
 *                   type: string
 *                   nullable: true
 *       400:
 *         description: amount is required or insufficient approved commissions
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Affiliate not found
 */
router.post('/', authenticate, createPayout);

/**
 * @swagger
 * /payouts:
 *   get:
 *     summary: Get all payouts
 *     tags: [Payouts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *     responses:
 *       200:
 *         description: Paginated list of all payouts
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
 *                       amount:
 *                         type: string
 *                       status:
 *                         type: string
 *                         enum: [pending, paid]
 *                       paid_at:
 *                         type: string
 *                         nullable: true
 *                       affiliate_id:
 *                         type: integer
 *                       first_name:
 *                         type: string
 *                       last_name:
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
 *                     pages:
 *                       type: integer
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Admin access required
 */
router.get('/', authenticate, authorizeAdmin, getPayouts);

/**
 * @swagger
 * /payouts/affiliate:
 *   get:
 *     summary: Get my payouts
 *     tags: [Payouts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *     responses:
 *       200:
 *         description: Paginated list of affiliate's own payouts
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
 *                       amount:
 *                         type: string
 *                       status:
 *                         type: string
 *                         enum: [pending, paid]
 *                       paid_at:
 *                         type: string
 *                         nullable: true
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     page:
 *                       type: integer
 *                     limit:
 *                       type: integer
 *                     total:
 *                       type: integer
 *                     pages:
 *                       type: integer
 *       401:
 *         description: Unauthorized
 */
router.get('/affiliate', authenticate, getMyPayouts);

/**
 * @swagger
 * /payouts/{id}/status:
 *   put:
 *     summary: Mark payout as paid
 *     tags: [Payouts]
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
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [paid]
 *                 example: paid
 *     responses:
 *       200:
 *         description: Payout marked as paid
 *       400:
 *         description: Status must be paid
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Admin access required
 *       404:
 *         description: Payout not found
 *       409:
 *         description: Payout already marked as paid
 */
router.put('/:id/status', authenticate, authorizeAdmin, updatePayoutStatus);

export default router;
