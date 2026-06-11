const pool = require('../config/db');

const getAffiliates = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT a.*, u.email 
      FROM affiliates a
      JOIN users u ON a.user_id = u.id
      ORDER BY a.created_at DESC
    `);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const getAffiliate = async (req, res) => {
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
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const createAffiliate = async (req, res) => {
  try {
    const { first_name, last_name, website } = req.body;
    const user_id = req.user.id;

    const existing = await pool.query(
      'SELECT id FROM affiliates WHERE user_id = $1', [user_id]
    );
    if (existing.rows.length > 0) {
      return res.status(400).json({ error: 'Affiliate profile already exists' });
    }

    const result = await pool.query(`
      INSERT INTO affiliates (user_id, first_name, last_name, website)
      VALUES ($1, $2, $3, $4) RETURNING *
    `, [user_id, first_name, last_name, website]);

    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const updateAffiliateStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const result = await pool.query(`
      UPDATE affiliates SET status = $1 WHERE id = $2 RETURNING *
    `, [status, id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Affiliate not found' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const deleteAffiliate = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      'DELETE FROM affiliates WHERE id = $1 RETURNING *', [id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Affiliate not found' });
    }
    res.json({ message: 'Affiliate deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = { getAffiliates, getAffiliate, createAffiliate, updateAffiliateStatus, deleteAffiliate };