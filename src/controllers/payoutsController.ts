import type { Request, Response } from 'express';
import pool from '../config/db';

interface PayoutBody {
    affiliate_id: number;
    amount: number;
}

interface PaginationQuery {
    page?: string;
    limit?: string;
    status?: 'pending' | 'paid';
}

interface AuthedRequest extends Request<
    Record<string, string>,
    unknown,
    PayoutBody,
    PaginationQuery
> {
    user?: {
        id: number;
        role: string;
    };
}

export const createPayout = async (
    req: AuthedRequest,
    res: Response
): Promise<Response | void> => {
    const client = await pool.connect();
    try {
        const isAdmin = req.user?.role === 'admin';

        await client.query('BEGIN');

        // Lock affiliate row
        const affiliate = isAdmin
            ? await client.query(
                  'SELECT id FROM affiliates WHERE id = $1 FOR UPDATE',
                  [req.body?.affiliate_id]
              )
            : await client.query(
                  'SELECT id FROM affiliates WHERE user_id = $1 FOR UPDATE',
                  [req.user?.id]
              );

        if (affiliate.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({ error: 'Affiliate not found' });
        }

        const affiliate_id = affiliate.rows[0].id;
        const amount = req.body?.amount;

        if (!amount) {
            await client.query('ROLLBACK');
            return res.status(400).json({ error: 'amount is required' });
        }

        // Lock approved conversions and calculate available
        const conversionsResult = await client.query(
            `
                SELECT id, commission
                FROM conversions
                WHERE status = 'approved'
                AND link_id IN (
                    SELECT id
                    FROM links
                    WHERE affiliate_id = $1
                )
                FOR UPDATE
	        `,
            [affiliate_id]
        );

        const totalCommissions = conversionsResult.rows.reduce(
            (total, conversion) => total + Number(conversion.commission),
            0
        );
        if (amount > totalCommissions) {
            await client.query('ROLLBACK');
            return res.status(400).json({
                error: `Insufficient approved commissions. Available: ${totalCommissions}`,
            });
        }

        // Insert payout
        const result = await client.query(
            'INSERT INTO payouts (affiliate_id, amount, status) VALUES ($1, $2, $3) RETURNING *',
            [affiliate_id, amount, 'pending']
        );

        await client.query('COMMIT');
        return res.status(201).json({
            ...result.rows[0],
            totalCommission: totalCommissions - Number(amount),
        });
    } catch (err) {
        await client.query('ROLLBACK');
        const message = err instanceof Error ? err.message : 'Unknown error';
        return res.status(500).json({ error: message });
    } finally {
        client.release();
    }
};

export const getPayouts = async (
    req: AuthedRequest,
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
            whereClause = `WHERE p.status = $${values.length}`;
        }

        const [result, countResult] = await Promise.all([
            pool.query(
                `
                SELECT
                    p.id,
                    p.amount,
                    p.status,
                    p.paid_at,
                    p.created_at,
                    a.id as affiliate_id,
                    a.first_name,
                    a.last_name
                FROM payouts p
                JOIN affiliates a ON p.affiliate_id = a.id
                ${whereClause}
                ORDER BY p.id DESC
                LIMIT $${values.length + 1} OFFSET $${values.length + 2}
            `,
                [...values, limit, offset]
            ),
            pool.query(
                `
                SELECT COUNT(*) FROM payouts p
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

export const getMyPayouts = async (
    req: AuthedRequest,
    res: Response
): Promise<Response> => {
    try {
        const page = parseInt(req.query.page ?? '1') || 1;
        const limit = parseInt(req.query.limit ?? '20') || 20;
        const offset = (page - 1) * limit;
        const status = req.query.status;

        const values: unknown[] = [req.user?.id];
        let statusClause = '';

        if (status) {
            values.push(status);
            statusClause = `AND p.status = $${values.length}`;
        }
        const [result, countResult] = await Promise.all([
            pool.query(
                `
		SELECT
			p.id,
			p.amount,
			p.status,
			p.paid_at, 
            p.created_at
		FROM payouts p
		WHERE p.affiliate_id = (
			SELECT id
			FROM affiliates
			WHERE user_id = $1
		)
		${statusClause}
		ORDER BY p.id DESC
		LIMIT $${values.length + 1}
		OFFSET $${values.length + 2}
		`,
                [...values, limit, offset]
            ),

            pool.query(
                `
		SELECT COUNT(*)
		FROM payouts p
		WHERE p.affiliate_id = (
			SELECT id
			FROM affiliates
			WHERE user_id = $1
		)
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

export const updatePayoutStatus = async (
    req: Request,
    res: Response
): Promise<Response | void> => {
    const client = await pool.connect();
    try {
        const { id } = req.params;
        const { status } = req.body;

        if (status !== 'paid') {
            return res.status(400).json({ error: 'Status must be paid' });
        }

        await client.query('BEGIN');

        const existing = await client.query(
            'SELECT id, status FROM payouts WHERE id = $1 FOR UPDATE',
            [id]
        );

        if (existing.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({ error: 'Payout not found' });
        }

        if (existing.rows[0].status === 'paid') {
            await client.query('ROLLBACK');
            return res
                .status(409)
                .json({ error: 'Payout already marked as paid' });
        }

        await client.query(
            'UPDATE payouts SET status = $1, paid_at = $2 WHERE id = $3',
            [status, new Date(), id]
        );

        await client.query('COMMIT');

        // Return full payout with affiliate
        const full = await pool.query(
            `
            SELECT
                p.id,
                p.amount,
                p.status,
                p.paid_at,
                p.created_at,
                a.id as affiliate_id,
                a.first_name,
                a.last_name
            FROM payouts p
            JOIN affiliates a ON p.affiliate_id = a.id
            WHERE p.id = $1
        `,
            [id]
        );

        return res.json(full.rows[0]);
    } catch (err) {
        await client.query('ROLLBACK');
        const message = err instanceof Error ? err.message : 'Unknown error';
        return res.status(500).json({ error: message });
    } finally {
        client.release();
    }
};

export const getAvailableCommissions = async (
	req: AuthedRequest,
	res: Response
): Promise<Response> => {
	try {
		const result = await pool.query(
			`
			SELECT
				GREATEST(
					COALESCE(SUM(c.commission), 0) -
					COALESCE((
						SELECT SUM(p.amount)
						FROM payouts p
						WHERE p.affiliate_id = (
							SELECT id
							FROM affiliates
							WHERE user_id = $1
						)
						AND p.status = 'pending'
					), 0),
					0
				) AS available
			FROM conversions c
			WHERE c.status = 'approved'
			AND c.link_id IN (
				SELECT id
				FROM links
				WHERE affiliate_id = (
					SELECT id
					FROM affiliates
					WHERE user_id = $1
				)
			)
			`,
			[req.user?.id]
		);

        console.log(result.rows[0])

		return res.json({
			available: parseFloat(result.rows[0].available),
		});
	} catch (err) {
		const message = err instanceof Error ? err.message : 'Unknown error';
		return res.status(500).json({ error: message });
	}
};
