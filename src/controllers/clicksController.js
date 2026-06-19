const pool = require('../config/db');

const trackClick = async (req, res) => {
    try {
        const { slug } = req.params;

        const linkResult = await pool.query(
            'SELECT * FROM links WHERE slug = $1',
            [slug]
        );
        if (linkResult.rows.length === 0) {
            return res.status(404).json({ error: 'Link not found' });
        }

        const link = linkResult.rows[0];

        await pool.query(
            'INSERT INTO clicks (link_id, ip_address, user_agent) VALUES ($1, $2, $3)',
            [link.id, req.ip, req.headers['user-agent'] || null]
        );

        res.redirect(link.original_url);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

const getClicks = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const offset = (page - 1) * limit;

        const countResult = await pool.query('SELECT COUNT(*) FROM clicks');
        const total = parseInt(countResult.rows[0].count);

        const result = await pool.query(`
            SELECT 
                c.id,
                c.ip_address,
                c.user_agent,
                c.clicked_at,
                l.slug,
                l.original_url,
                a.first_name,
                a.last_name,
                p.name as program_name
            FROM clicks c
            JOIN links l ON c.link_id = l.id
            JOIN affiliates a ON l.affiliate_id = a.id
            JOIN programs p ON l.program_id = p.id
            ORDER BY c.clicked_at DESC
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

const getMyClicks = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const offset = (page - 1) * limit;

        const countResult = await pool.query(`
            SELECT COUNT(*) FROM clicks c
            JOIN links l ON c.link_id = l.id
            WHERE l.affiliate_id = (SELECT id FROM affiliates WHERE user_id = $1)
        `, [req.user.id]);
        const total = parseInt(countResult.rows[0].count);

        const result = await pool.query(`
            SELECT
                c.id,
                c.ip_address,
                c.user_agent,
                c.clicked_at,
                l.slug,
                l.original_url,
                p.name as program_name
            FROM clicks c
            JOIN links l ON c.link_id = l.id
            JOIN programs p ON l.program_id = p.id
            WHERE l.affiliate_id = (SELECT id FROM affiliates WHERE user_id = $1)
            ORDER BY c.clicked_at DESC
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

module.exports = { trackClick, getClicks, getMyClicks };