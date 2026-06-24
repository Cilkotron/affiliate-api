const pool = require('../config/db');

const createPayout = async (req, res) => {
    try {
        const isAdmin = req.user.role === 'admin';

        const affiliate = isAdmin
            ? await pool.query('SELECT id FROM affiliates WHERE id = $1', [req.body.affiliate_id])
            : await pool.query('SELECT id FROM affiliates WHERE user_id = $1', [req.user.id]);

        if (affiliate.rows.length === 0) {
            return res.status(404).json({ error: 'Affiliate not found' });
        }

        const affiliate_id = affiliate.rows[0].id;
        const { amount } = req.body;

        if (!amount) {
            return res.status(400).json({ error: 'amount is required' });
        }

        // Check if commission is with status approved
        const commissionsResult = await pool.query(`
            SELECT COALESCE(SUM(commission), 0) as total
            FROM conversions
            WHERE status = 'approved'
            AND link_id IN (
                SELECT id FROM links WHERE affiliate_id = $1
            )
        `, [affiliate_id]);

        const totalCommissions = parseFloat(commissionsResult.rows[0].total);
        if (amount > totalCommissions) {
            return res.status(400).json({
                error: `Insufficient approved commissions. Available: ${totalCommissions}`
            });
        }

        const result = await pool.query(
            'INSERT INTO payouts (affiliate_id, amount, status) VALUES ($1, $2, $3) RETURNING *',
            [affiliate_id, amount, 'pending']
        );

        res.status(201).json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

const getPayouts = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const offset = (page - 1) * limit;

        const countResult = await pool.query('SELECT COUNT(*) FROM payouts');
        const total = parseInt(countResult.rows[0].count);

        const result = await pool.query(`
            SELECT
                p.id,
                p.amount,
                p.status,
                p.paid_at,
                a.id as affiliate_id,
                a.first_name,
                a.last_name
            FROM payouts p
            JOIN affiliates a ON p.affiliate_id = a.id
            ORDER BY p.id DESC
            LIMIT $1 OFFSET $2
        `, [limit, offset]);

        res.json({
            data: result.rows,
            pagination: {
                total,
                page,
                limit,
                pages: Math.ceil(total / limit),
            }
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

const getMyPayouts = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const offset = (page - 1) * limit;

        const countResult = await pool.query(`
            SELECT COUNT(*) FROM payouts
            WHERE affiliate_id = (SELECT id FROM affiliates WHERE user_id = $1)
        `, [req.user.id]);
        const total = parseInt(countResult.rows[0].count);

        const result = await pool.query(`
            SELECT
                p.id,
                p.amount,
                p.status,
                p.paid_at
            FROM payouts p
            WHERE p.affiliate_id = (SELECT id FROM affiliates WHERE user_id = $1)
            ORDER BY p.id DESC
            LIMIT $2 OFFSET $3
        `, [req.user.id, limit, offset]);

        res.json({
            data: result.rows,
            pagination: {
                total,
                page,
                limit,
                pages: Math.ceil(total / limit),
            }
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

const updatePayoutStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        if (!['pending', 'paid'].includes(status)) {
            return res.status(400).json({ error: 'Invalid status. Must be pending or paid' });
        }

        const paid_at = status === 'paid' ? new Date() : null;

        const result = await pool.query(
            'UPDATE payouts SET status = $1, paid_at = $2 WHERE id = $3 RETURNING *',
            [status, paid_at, id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Payout not found' });
        }

        res.json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

module.exports = { createPayout, getPayouts, getMyPayouts, updatePayoutStatus };