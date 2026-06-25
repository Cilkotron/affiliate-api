const pool = require('../config/db');

const getPrograms = async (req, res) => {
    try {
        const result = await pool.query(
            'SELECT * FROM programs ORDER BY created_at DESC'
        );
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

const getProgram = async (req, res) => {
    try {
        const { id } = req.params;
        const result = await pool.query(
            'SELECT * FROM programs WHERE id = $1',
            [id]
        );
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Program not found' });
        }
        res.json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

const createProgram = async (req, res) => {
    try {
        const { name, description, commission_rate, status } = req.body;
        const result = await pool.query(
            `INSERT INTO programs (name, description, commission_rate, status) 
       VALUES ($1, $2, $3, $4) RETURNING *`,
            [name, description, commission_rate, status || 'active']
        );
        res.status(201).json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

const updateProgram = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, description, commission_rate, status, version } =
            req.body;

        if (!version) {
            return res.status(400).json({ error: 'version is required' });
        }

        // Check if program exists
        const existing = await pool.query(
            'SELECT id FROM programs WHERE id = $1',
            [id]
        );
        if (existing.rows.length === 0) {
            return res.status(404).json({ error: 'Program not found' });
        }

        // Update with version check
        const result = await pool.query(
            `UPDATE programs 
            SET name = $1, description = $2, commission_rate = $3, status = $4, version = version + 1
            WHERE id = $5 AND version = $6
            RETURNING *`,
            [name, description, commission_rate, status, id, version]
        );

        if (result.rows.length === 0) {
            return res.status(409).json({ error: 'Program was modified by another request. Please refresh and try again.' });
        }

        if (result.rows.length === 0) {
            return res
                .status(409)
                .json({
                    error: 'Program was modified by another request. Please refresh and try again.',
                });
        }

        res.json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

const deleteProgram = async (req, res) => {
    try {
        const { id } = req.params;
        const result = await pool.query(
            'DELETE FROM programs WHERE id = $1 RETURNING *',
            [id]
        );
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Program not found' });
        }
        res.json({ message: 'Program deleted successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

module.exports = {
    getPrograms,
    getProgram,
    createProgram,
    updateProgram,
    deleteProgram,
};
