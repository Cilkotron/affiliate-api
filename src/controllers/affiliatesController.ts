import type { Request, Response } from 'express';
import pool from '../config/db';

type AffiliateStatus = 'pending' | 'approved' | 'rejected';

interface AuthedRequest extends Request {
    user?: { id: string | number };
}

export interface UpdateAffiliateStatusBody {
    status?: AffiliateStatus;
    version?: number;
}

export const getAffiliates = async (
    req: Request,
    res: Response
): Promise<Response> => {
    try {
        const result = await pool.query(`
            SELECT a.*, u.email
            FROM affiliates a
            JOIN users u ON a.user_id = u.id
            ORDER BY a.created_at DESC
        `);
        return res.json(result.rows);
    } catch (err) {
        const message = err instanceof Error ? err.message : 'Unknown error';
        return res.status(500).json({ error: message });
    }
};

export const getAffiliate = async (
    req: Request,
    res: Response
): Promise<Response> => {
    try {
        const { id } = req.params;

        const result = await pool.query(`
            SELECT a.*, u.email
            FROM affiliates a
            JOIN users u ON a.user_id = u.id
            WHERE a.id = $1
        `, [id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Affiliate not found' });
        }

        return res.json(result.rows[0]);
    } catch (err) {
        const message = err instanceof Error ? err.message : 'Unknown error';
        return res.status(500).json({ error: message });
    }
};

export const createAffiliate = async (
    req: AuthedRequest,
    res: Response
): Promise<Response> => {
    try {
        const { first_name, last_name, website } = req.body ?? {};

        const user_id = req.user?.id;
        if (user_id === undefined || user_id === null) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        const existing = await pool.query(
            'SELECT id FROM affiliates WHERE user_id = $1',
            [user_id]
        );
        if (existing.rows.length > 0) {
            return res.status(400).json({ error: 'Affiliate profile already exists' });
        }

        const result = await pool.query(`
            INSERT INTO affiliates (user_id, first_name, last_name, website)
            VALUES ($1, $2, $3, $4) RETURNING *
        `, [user_id, first_name ?? null, last_name ?? null, website ?? null]);

        return res.status(201).json(result.rows[0]);
    } catch (err) {
        const message = err instanceof Error ? err.message : 'Unknown error';
        return res.status(500).json({ error: message });
    }
};

export const updateAffiliateStatus = async (
    req: Request<{ id?: string }>,
    res: Response
): Promise<Response> => {
    try {
        const { id } = req.params;
        const { status, version } = req.body as UpdateAffiliateStatusBody;

        if (!id) {
            return res.status(400).json({ error: 'id is required' });
        }

        if (!version && version !== 0) {
            return res.status(400).json({ error: 'version is required' });
        }

        const allowedStatuses: AffiliateStatus[] = ['pending', 'approved', 'rejected'];
        if (!status || !allowedStatuses.includes(status)) {
            return res.status(400).json({
                error: 'Invalid status. Must be pending, approved, or rejected',
            });
        }

        const existing = await pool.query(
            'SELECT id FROM affiliates WHERE id = $1',
            [id]
        );
        if (existing.rows.length === 0) {
            return res.status(404).json({ error: 'Affiliate not found' });
        }

        const result = await pool.query(`
            UPDATE affiliates
            SET status = $1, version = version + 1
            WHERE id = $2 AND version = $3
            RETURNING *
        `, [status, id, version]);

        if (result.rows.length === 0) {
            return res.status(409).json({
                error: 'Affiliate was modified by another request. Please refresh and try again.',
            });
        }

        return res.json(result.rows[0]);
    } catch (err) {
        const message = err instanceof Error ? err.message : 'Unknown error';
        return res.status(500).json({ error: message });
    }
};

export const deleteAffiliate = async (
    req: Request<{ id?: string }>,
    res: Response
): Promise<Response> => {
    try {
        const { id } = req.params;

        if (!id) {
            return res.status(400).json({ error: 'id is required' });
        }

        const result = await pool.query(
            'DELETE FROM affiliates WHERE id = $1 RETURNING *',
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Affiliate not found' });
        }

        return res.json({ message: 'Affiliate deleted successfully' });
    } catch (err) {
        const message = err instanceof Error ? err.message : 'Unknown error';
        return res.status(500).json({ error: message });
    }
};