const pool = require('../config/db');

const joinProgram = async (req, res) => {
    try {
        const { program_id } = req.params;

        // Check if affiliate & status is approved
        const affiliate = await pool.query(
            'SELECT id FROM affiliates WHERE user_id = $1 AND status = $2',
            [req.user.id, 'approved']
        );
        if (affiliate.rows.length === 0) {
            return res.status(403).json({ error: 'Affiliate not found or not approved' });
        }

        // Check if program & status is active
        const program = await pool.query(
            'SELECT id FROM programs WHERE id = $1 AND status = $2',
            [program_id, 'active']
        );
        if (program.rows.length === 0) {
            return res.status(404).json({ error: 'Program not found or inactive' });
        }

        const affiliate_id = affiliate.rows[0].id;

        // Check affiliate not already using program
        const existing = await pool.query(
            'SELECT id FROM affiliate_programs WHERE affiliate_id = $1 AND program_id = $2',
            [affiliate_id, program_id]
        );
        if (existing.rows.length > 0) {
            return res.status(409).json({ error: 'Already joined this program' });
        }

        const result = await pool.query(
            'INSERT INTO affiliate_programs (affiliate_id, program_id) VALUES ($1, $2) RETURNING *',
            [affiliate_id, program_id]
        );
        res.status(201).json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

const leaveProgram = async (req, res) => {
    try {
        const { program_id } = req.params;

        const affiliate = await pool.query(
            'SELECT id FROM affiliates WHERE user_id = $1',
            [req.user.id]
        );
        if (affiliate.rows.length === 0) {
            return res.status(404).json({ error: 'Affiliate not found' });
        }

        const affiliate_id = affiliate.rows[0].id;

        const result = await pool.query(
            'DELETE FROM affiliate_programs WHERE affiliate_id = $1 AND program_id = $2 RETURNING *',
            [affiliate_id, program_id]
        );
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Not joined this program' });
        }

        res.json({ message: 'Left program successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

const getMyPrograms = async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT
                ap.id,
                ap.joined_at,
                p.id as program_id,
                p.name,
                p.description,
                p.commission_rate,
                p.status
            FROM affiliate_programs ap
            JOIN programs p ON ap.program_id = p.id
            WHERE ap.affiliate_id = (SELECT id FROM affiliates WHERE user_id = $1)
            ORDER BY ap.joined_at DESC
        `, [req.user.id]);

        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

const getAllAffiliatePrograms = async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT
                ap.id,
                ap.joined_at,
                a.first_name,
                a.last_name,
                p.name as program_name,
                p.commission_rate,
                p.status as program_status
            FROM affiliate_programs ap
            JOIN affiliates a ON ap.affiliate_id = a.id
            JOIN programs p ON ap.program_id = p.id
            ORDER BY ap.joined_at DESC
        `);

        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

module.exports = { joinProgram, leaveProgram, getMyPrograms, getAllAffiliatePrograms };