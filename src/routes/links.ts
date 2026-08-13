import { Router } from 'express';
import {
    getLinks,
    createLink,
    deleteLink,
} from '../controllers/linksController';
import { authenticate, authorizeAdmin } from '../middleware/auth';

const router = Router();

/**
 * @swagger
 * /links:
 *   get:
 *     summary: Get all links
 *     tags: [Links]
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
 *           default: 10
 *     responses:
 *       200:
 *         description: Paginated list of all links
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
 *                       affiliate_id:
 *                         type: integer
 *                       program_id:
 *                         type: integer
 *                       slug:
 *                         type: string
 *                       original_url:
 *                         type: string
 *                       created_at:
 *                         type: string
 *                       first_name:
 *                         type: string
 *                       last_name:
 *                         type: string
 *                       program_name:
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
router.get('/', authenticate, authorizeAdmin, getLinks);

/**
 * @swagger
 * /links/affiliate:
 *   get:
 *     summary: Get my links
 *     tags: [Links]
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
 *           default: 10
 *     responses:
 *       200:
 *         description: Paginated list of affiliate's own links
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
 *                       slug:
 *                         type: string
 *                       original_url:
 *                         type: string
 *                       program_name:
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
 */
router.get('/affiliate', authenticate, getLinks);

/**
 * @swagger
 * /links:
 *   post:
 *     summary: Create a tracking link
 *     tags: [Links]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - program_id
 *               - original_url
 *             properties:
 *               program_id:
 *                 type: integer
 *                 example: 1
 *               original_url:
 *                 type: string
 *                 example: https://example.com/products
 *     responses:
 *       201:
 *         description: Link created successfully
 *       400:
 *         description: program_id and original_url are required
 *       403:
 *         description: You have not joined this program
 *       404:
 *         description: Affiliate not found
 *       401:
 *         description: Unauthorized
 */
router.post('/', authenticate, createLink);

/**
 * @swagger
 * /links/{id}:
 *   delete:
 *     summary: Delete any link
 *     tags: [Links]
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
 *         description: Link deleted successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Admin access required
 *       404:
 *         description: Link not found or unauthorized
 */
router.delete('/:id', authenticate, authorizeAdmin, deleteLink);

/**
 * @swagger
 * /links/affiliate/{id}:
 *   delete:
 *     summary: Delete own link
 *     tags: [Links]
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
 *         description: Link deleted successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Link not found or unauthorized
 */
router.delete('/affiliate/:id', authenticate, deleteLink);

export default router;
