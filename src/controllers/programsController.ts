import type { Request, Response } from 'express';
import pool from '../config/db';

export const getPrograms = async (
    req: Request,
    res: Response
): Promise<Response> => {
    try {
        const result = await pool.query(
            'SELECT * FROM programs ORDER BY created_at DESC'
        );
        return res.json(result.rows);
    } catch (err) {
        const message = err instanceof Error ? err.message : 'Unknown error';
        return res.status(500).json({ error: message });
    }
};

export const getProgram = async (
    req: Request,
    res: Response
): Promise<Response> => {
    try {
        const { id } = req.params;
        const result = await pool.query(
            'SELECT * FROM programs WHERE id = $1',
            [id]
        );
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Program not found' });
        }
        return res.json(result.rows[0]);
    } catch (err) {
        const message = err instanceof Error ? err.message : 'Unknown error';
        return res.status(500).json({ error: message });
    }
};

export const createProgram = async (
    req: Request,
    res: Response
): Promise<Response> => {
    try {
        const { name, description, commission_rate, status } = req.body;
        const result = await pool.query(
            `INSERT INTO programs (name, description, commission_rate, status)
             VALUES ($1, $2, $3, $4) RETURNING *`,
            [name, description, commission_rate, status || 'active']
        );
        return res.status(201).json(result.rows[0]);
    } catch (err) {
        const message = err instanceof Error ? err.message : 'Unknown error';
        return res.status(500).json({ error: message });
    }
};

export const updateProgram = async (
    req: Request,
    res: Response
): Promise<Response> => {
    try {
        const { id } = req.params;
        const { name, description, commission_rate, status, version } = req.body;

        if (!version) {
            return res.status(400).json({ error: 'version is required' });
        }

        const existing = await pool.query(
            'SELECT id FROM programs WHERE id = $1',
            [id]
        );
        if (existing.rows.length === 0) {
            return res.status(404).json({ error: 'Program not found' });
        }

        const result = await pool.query(
            `UPDATE programs
             SET name = $1, description = $2, commission_rate = $3, status = $4, version = version + 1
             WHERE id = $5 AND version = $6
             RETURNING *`,
            [name, description, commission_rate, status, id, version]
        );
        if (result.rows.length === 0) {
            return res.status(409).json({
                error: 'Program was modified by another request. Please refresh and try again.',
            });
        }

        return res.json(result.rows[0]);
    } catch (err) {
        const message = err instanceof Error ? err.message : 'Unknown error';
        return res.status(500).json({ error: message });
    }
};

export const deleteProgram = async (
    req: Request,
    res: Response
): Promise<Response> => {
    try {
        const { id } = req.params;
        const result = await pool.query(
            'DELETE FROM programs WHERE id = $1 RETURNING *',
            [id]
        );
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Program not found' });
        }
        return res.json({ message: 'Program deleted successfully' });
    } catch (err) {
        const message = err instanceof Error ? err.message : 'Unknown error';
        return res.status(500).json({ error: message });
    }
};