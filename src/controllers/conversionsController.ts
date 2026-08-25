import type { Request, Response } from 'express';
import pool from '../config/db';

interface AuthedRequest extends Request {
    user?: { id: number; role: string };
}

interface PaginationQuery {
    page?: string;
    limit?: string;
    status?: 'pending' | 'approved' | 'paid';
}

type ConversionStatus = 'pending' | 'approved' | 'paid';

type CreateConversionBody = {
    click_id: number;
    amount: number;
};

type UpdateConversionStatusBody = {
    status: ConversionStatus;
};

export const createConversion = async (
    req: Request,
    res: Response
): Promise<Response> => {
    const client = await pool.connect();
    try {
        const { click_id, amount } = req.body as CreateConversionBody;

        if (!click_id || !amount) {
            return res
                .status(400)
                .json({ error: 'click_id and amount are required' });
        }

        await client.query('BEGIN');

        // Lock click row to prevent duplicate conversions
        const clickResult = await client.query(
            `SELECT c.*, l.program_id, l.id as link_id
             FROM clicks c
             JOIN links l ON c.link_id = l.id
             WHERE c.id = $1
             FOR UPDATE`,
            [click_id]
        );

        if (clickResult.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({ error: 'Click not found' });
        }

        const click = clickResult.rows[0];

        // Prevent duplicate conversion for the same click
        const existing = await client.query(
            'SELECT id FROM conversions WHERE click_id = $1',
            [click_id]
        );
        if (existing.rows.length > 0) {
            await client.query('ROLLBACK');
            return res
                .status(409)
                .json({ error: 'Conversion already exists for this click' });
        }

        // Get commission rate from program
        const programResult = await client.query<{ commission_rate: string }>(
            'SELECT commission_rate FROM programs WHERE id = $1',
            [click.program_id]
        );

        const commission_rate = parseFloat(
            programResult.rows[0].commission_rate
        );
        const commission = parseFloat(
            ((amount * commission_rate) / 100).toFixed(2)
        );

        const result = await client.query(
            `INSERT INTO conversions (click_id, link_id, amount, commission, status)
             VALUES ($1, $2, $3, $4, 'pending') RETURNING *`,
            [click_id, click.link_id, amount, commission]
        );

        await client.query('COMMIT');
        return res.status(201).json(result.rows[0]);
    } catch (err) {
        await client.query('ROLLBACK');
        const message = err instanceof Error ? err.message : 'Unknown error';
        return res.status(500).json({ error: message });
    } finally {
        client.release();
    }
};

export const getConversions = async (
    req: Request<Record<string, never>, unknown, unknown, PaginationQuery>,
    res: Response
): Promise<Response> => {
    try {
        const page = parseInt(req.query.page ?? '1') || 1;
        const limit = parseInt(req.query.limit ?? '20') || 20;
        const offset = (page - 1) * limit;
        const status = req.query.status;

        const values: unknown[] = [];
        let whereClause = '';

        if (status) {
            values.push(status);
            whereClause = `WHERE cv.status = $${values.length}`;
        }

        const [result, countResult] = await Promise.all([
            pool.query(
                `
                SELECT
                    cv.id,
                    cv.amount,
                    cv.commission,
                    cv.status,
                    cv.created_at,
                    a.first_name,
                    a.last_name,
                    p.name as program_name,
                    l.slug
                FROM conversions cv
                JOIN links l ON cv.link_id = l.id
                JOIN affiliates a ON l.affiliate_id = a.id
                JOIN programs p ON l.program_id = p.id
                ${whereClause}
                ORDER BY cv.created_at DESC
                LIMIT $${values.length + 1} OFFSET $${values.length + 2}
            `,
                [...values, limit, offset]
            ),

            pool.query(
                `
                SELECT COUNT(*) FROM conversions cv
                JOIN links l ON cv.link_id = l.id
                JOIN affiliates a ON l.affiliate_id = a.id
                ${whereClause}
            `,
                values
            ),
        ]);
        const total = parseInt(countResult.rows[0].count);

        return res.json({
            data: result.rows,
            pagination: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit),
            },
        });
    } catch (err) {
        const message = err instanceof Error ? err.message : 'Unknown error';
        return res.status(500).json({ error: message });
    }
};

export const getMyConversions = async (
    req: AuthedRequest,
    res: Response
): Promise<Response> => {
    try {
        const page = parseInt((req.query.page as string) ?? '1') || 1;
        const limit = parseInt((req.query.limit as string) ?? '20') || 20;
        const offset = (page - 1) * limit;
        const status = req.query.status as string | undefined;

        const values: unknown[] = [req.user?.id];
        let statusClause = '';

        if (status) {
            values.push(status);
            statusClause = `AND cv.status = $${values.length}`;
        }

        const [result, countResult] = await Promise.all([
            pool.query(
                `
                SELECT
                    cv.id,
                    cv.amount,
                    cv.commission,
                    cv.status,
                    cv.created_at,
                    p.name as program_name,
                    l.slug
                FROM conversions cv
                JOIN links l ON cv.link_id = l.id
                JOIN programs p ON l.program_id = p.id
                WHERE l.affiliate_id = (SELECT id FROM affiliates WHERE user_id = $1)
                ${statusClause}
                ORDER BY cv.created_at DESC
                LIMIT $${values.length + 1} OFFSET $${values.length + 2}
            `,
                [...values, limit, offset]
            ),

            pool.query(
                `
                SELECT COUNT(*) FROM conversions cv
                JOIN links l ON cv.link_id = l.id
                WHERE l.affiliate_id = (SELECT id FROM affiliates WHERE user_id = $1)
                ${statusClause}
            `,
                values
            ),
        ]);

        const total = parseInt(countResult.rows[0].count);

        return res.json({
            data: result.rows,
            pagination: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit),
            },
        });
    } catch (err) {
        const message = err instanceof Error ? err.message : 'Unknown error';
        return res.status(500).json({ error: message });
    }
};

export const updateConversionStatus = async (
    req: Request,
    res: Response
): Promise<Response> => {
    try {
        const { id } = req.params;
        const { status } = req.body as UpdateConversionStatusBody;

        const allowedStatuses: ConversionStatus[] = [
            'pending',
            'approved',
            'paid',
        ];
        if (!allowedStatuses.includes(status)) {
            return res.status(400).json({
                error: 'Invalid status. Must be pending, approved, or paid',
            });
        }

        const result = await pool.query(
            `
            UPDATE conversions SET status = $1 WHERE id = $2
            RETURNING id, amount, commission, status, created_at
        `,
            [status, id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Conversion not found' });
        }

        // Fetch full conversion with joins
        const full = await pool.query(
            `
            SELECT
                cv.id,
                cv.amount,
                cv.commission,
                cv.status,
                cv.created_at,
                a.first_name,
                a.last_name,
                p.name as program_name,
                l.slug
            FROM conversions cv
            JOIN links l ON cv.link_id = l.id
            JOIN affiliates a ON l.affiliate_id = a.id
            JOIN programs p ON l.program_id = p.id
            WHERE cv.id = $1
        `,
            [id]
        );

        return res.json(full.rows[0]);
    } catch (err) {
        const message = err instanceof Error ? err.message : 'Unknown error';
        return res.status(500).json({ error: message });
    }
};
