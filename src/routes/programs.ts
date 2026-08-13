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

/**
 * @swagger
 * /programs:
 *   get:
 *     summary: Get all programs
 *     tags: [Programs]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of all programs
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: integer
 *                   name:
 *                     type: string
 *                   description:
 *                     type: string
 *                   commission_rate:
 *                     type: number
 *                   status:
 *                     type: string
 *                     enum: [active, inactive]
 *                   created_at:
 *                     type: string
 *                   version:
 *                     type: integer
 *       401:
 *         description: Unauthorized
 */
router.get(
    '/',
    (req: Request, res: Response, next: NextFunction) =>
        authenticate(req, res, next),
    getPrograms
);

/**
 * @swagger
 * /programs/{id}:
 *   get:
 *     summary: Get program by ID
 *     tags: [Programs]
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
 *         description: Program found
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Program not found
 */
router.get(
    '/:id',
    (req: Request, res: Response, next: NextFunction) =>
        authenticate(req, res, next),
    getProgram
);

/**
 * @swagger
 * /programs:
 *   post:
 *     summary: Create a new program
 *     tags: [Programs]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - commission_rate
 *             properties:
 *               name:
 *                 type: string
 *                 example: Decathlon Partner Program
 *               description:
 *                 type: string
 *                 example: Promote Decathlon Products
 *               commission_rate:
 *                 type: number
 *                 example: 10.00
 *               status:
 *                 type: string
 *                 enum: [active, inactive]
 *                 default: inactive
 *     responses:
 *       201:
 *         description: Program created
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Admin access required
 */
router.post(
    '/',
    (req: Request, res: Response, next: NextFunction) =>
        authenticate(req, res, next),
    (req: Request, res: Response, next: NextFunction) =>
        authorizeAdmin(req, res, next),
    createProgram
);

/**
 * @swagger
 * /programs/{id}:
 *   put:
 *     summary: Update a program
 *     tags: [Programs]
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
 *               - name
 *               - commission_rate
 *               - status
 *               - version
 *             properties:
 *               name:
 *                 type: string
 *                 example: Decathlon Partner Program
 *               description:
 *                 type: string
 *                 example: Promote Decathlon products
 *               commission_rate:
 *                 type: number
 *                 example: 10.00
 *               status:
 *                 type: string
 *                 enum: [active, inactive]
 *               version:
 *                 type: integer
 *                 example: 1
 *     responses:
 *       200:
 *         description: Program updated
 *       400:
 *         description: Version is required
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Admin access required
 *       404:
 *         description: Program not found
 *       409:
 *         description: Program was modified by another request
 */
router.put(
    '/:id',
    (req: Request, res: Response, next: NextFunction) =>
        authenticate(req, res, next),
    (req: Request, res: Response, next: NextFunction) =>
        authorizeAdmin(req, res, next),
    updateProgram
);

/**
 * @swagger
 * /programs/{id}:
 *   delete:
 *     summary: Delete a program
 *     tags: [Programs]
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
 *         description: Program deleted successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Admin access required
 *       404:
 *         description: Program not found
 */
router.delete(
    '/:id',
    (req: Request, res: Response, next: NextFunction) =>
        authenticate(req, res, next),
    (req: Request, res: Response, next: NextFunction) =>
        authorizeAdmin(req, res, next),
    deleteProgram
);

export default router;
