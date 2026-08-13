import { Router } from 'express';
import {
    trackClick,
    getClicks,
    getMyClicks,
} from '../controllers/clicksController';
import { authenticate, authorizeAdmin } from '../middleware/auth';

const router = Router();

/**
 * @swagger
 * /clicks/go/{slug}:
 *   get:
 *     summary: Track click and redirect to original URL
 *     tags: [Clicks]
 *     parameters:
 *       - in: path
 *         name: slug
 *         required: true
 *         schema:
 *           type: string
 *         example: lorem-ipsum-dolor
 *     responses:
 *       302:
 *         description: Redirect to original URL
 *       404:
 *         description: Link not found
 */
router.get('/go/:slug', trackClick);

/**
 * @swagger
 * /clicks:
 *   get:
 *     summary: Get all clicks
 *     tags: [Clicks]
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
 *         description: Paginated list of all clicks
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
 *                       ip_address:
 *                         type: string
 *                       user_agent:
 *                         type: string
 *                       clicked_at:
 *                         type: string
 *                       slug:
 *                         type: string
 *                       original_url:
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
 *                     pages:
 *                       type: integer
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Admin access required
 */
router.get('/', authenticate, authorizeAdmin, getClicks);

/**
 * @swagger
 * /clicks/affiliate:
 *   get:
 *     summary: Get my clicks
 *     tags: [Clicks]
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
 *         description: Paginated list of affiliate's own clicks
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
 *                       ip_address:
 *                         type: string
 *                       user_agent:
 *                         type: string
 *                       clicked_at:
 *                         type: string
 *                       slug:
 *                         type: string
 *                       original_url:
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
 *                     pages:
 *                       type: integer
 *       401:
 *         description: Unauthorized
 */
router.get('/affiliate', authenticate, getMyClicks);

export default router;
