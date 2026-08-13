import { Router } from 'express';
import {
    createConversion,
    getConversions,
    getMyConversions,
    updateConversionStatus,
} from '../controllers/conversionsController';
import { authenticate, authorizeAdmin } from '../middleware/auth';

const router = Router();

/**
 * @swagger
 * /conversions:
 *   post:
 *     summary: Create a conversion
 *     tags: [Conversions]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - click_id
 *               - amount
 *             properties:
 *               click_id:
 *                 type: integer
 *                 example: 1
 *               amount:
 *                 type: number
 *                 example: 100.00
 *     responses:
 *       201:
 *         description: Conversion created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: integer
 *                 click_id:
 *                   type: integer
 *                 link_id:
 *                   type: integer
 *                 amount:
 *                   type: string
 *                 commission:
 *                   type: string
 *                 status:
 *                   type: string
 *                   enum: [pending, approved, paid]
 *                 created_at:
 *                   type: string
 *       400:
 *         description: click_id and amount are required
 *       404:
 *         description: Click not found
 *       409:
 *         description: Conversion already exists for this click
 */
router.post('/', createConversion);

/**
 * @swagger
 * /conversions:
 *   get:
 *     summary: Get all conversions
 *     tags: [Conversions]
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
 *         description: Paginated list of all conversions
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
 *                       commission:
 *                         type: string
 *                       status:
 *                         type: string
 *                         enum: [pending, approved, paid]
 *                       created_at:
 *                         type: string
 *                       first_name:
 *                         type: string
 *                       last_name:
 *                         type: string
 *                       program_name:
 *                         type: string
 *                       slug:
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
router.get('/', authenticate, authorizeAdmin, getConversions);

/**
 * @swagger
 * /conversions/affiliate:
 *   get:
 *     summary: Get my conversions
 *     tags: [Conversions]
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
 *         description: Paginated list of affiliate's own conversions
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
 *                       commission:
 *                         type: string
 *                       status:
 *                         type: string
 *                         enum: [pending, approved, paid]
 *                       created_at:
 *                         type: string
 *                       program_name:
 *                         type: string
 *                       slug:
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
 */
router.get('/affiliate', authenticate, getMyConversions);

/**
 * @swagger
 * /conversions/{id}/status:
 *   put:
 *     summary: Update conversion status
 *     tags: [Conversions]
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
 *                 enum: [pending, approved, paid]
 *                 example: approved
 *     responses:
 *       200:
 *         description: Conversion status updated
 *       400:
 *         description: Invalid status
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Admin access required
 *       404:
 *         description: Conversion not found
 */
router.put('/:id/status', authenticate, authorizeAdmin, updateConversionStatus);

export default router;
