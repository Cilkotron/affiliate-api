const pool = require('../config/db');

const createConversion = async (req, res) => {
    const client = await pool.connect();
    try {
        const { click_id, amount } = req.body;

        if (!click_id || !amount) {
            return res
                .status(400)
                .json({ error: 'click_id and amount are required' });
        }

        await client.query('BEGIN');

        // Lock click row to prevent duplicate conversions
        const clickResult = await client.query(
            `
            SELECT c.*, l.program_id, l.id as link_id
            FROM clicks c
            JOIN links l ON c.link_id = l.id
            WHERE c.id = $1
            FOR UPDATE
        `,
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
        const programResult = await client.query(
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
            `
            INSERT INTO conversions (click_id, link_id, amount, commission, status)
            VALUES ($1, $2, $3, $4, 'pending') RETURNING *
        `,
            [click_id, click.link_id, amount, commission]
        );

        await client.query('COMMIT');
        res.status(201).json(result.rows[0]);
    } catch (err) {
        await client.query('ROLLBACK');
        res.status(500).json({ error: err.message });
    } finally {
        client.release();
    }
};

const getConversions = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const offset = (page - 1) * limit;

        const countResult = await pool.query(
            'SELECT COUNT(*) FROM conversions'
        );
        const total = parseInt(countResult.rows[0].count);

        const result = await pool.query(
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
            ORDER BY cv.created_at DESC
            LIMIT $1 OFFSET $2
        `,
            [limit, offset]
        );

        res.json({
            data: result.rows,
            pagination: {
                total,
                page,
                limit,
                pages: Math.ceil(total / limit),
            },
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

const getMyConversions = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const offset = (page - 1) * limit;

        const countResult = await pool.query(
            `
            SELECT COUNT(*) FROM conversions cv
            JOIN links l ON cv.link_id = l.id
            WHERE l.affiliate_id = (SELECT id FROM affiliates WHERE user_id = $1)
        `,
            [req.user.id]
        );
        const total = parseInt(countResult.rows[0].count);

        const result = await pool.query(
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
            ORDER BY cv.created_at DESC
            LIMIT $2 OFFSET $3
        `,
            [req.user.id, limit, offset]
        );

        res.json({
            data: result.rows,
            pagination: {
                total,
                page,
                limit,
                pages: Math.ceil(total / limit),
            },
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

const updateConversionStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        if (!['pending', 'approved', 'paid'].includes(status)) {
            return res.status(400).json({
                error: 'Invalid status. Must be pending, approved, or paid',
            });
        }

        const result = await pool.query(
            'UPDATE conversions SET status = $1 WHERE id = $2 RETURNING *',
            [status, id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Conversion not found' });
        }

        res.json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

module.exports = {
    createConversion,
    getConversions,
    getMyConversions,
    updateConversionStatus,
};
