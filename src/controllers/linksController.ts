import type { Request, Response } from 'express';
import pool from '../config/db';

interface AuthedRequest extends Request {
    user?: { id: number; role: string };
}

type LinkRow = {
    id: number;
    affiliate_id: number;
    program_id: number;
    slug: string;
    original_url: string;
    created_at: Date;
};

type CreateLinkBody = {
    program_id: number;
    original_url: string;
};

const generateSlug = (): string => {
    const words = [
        'lorem',
        'ipsum',
        'dolor',
        'amet',
        'consectetur',
        'adipiscing',
        'elit',
        'sed',
        'eiusmod',
        'tempor',
        'incididunt',
        'labore',
        'dolore',
        'magna',
        'aliqua',
        'enim',
        'minim',
        'veniam',
        'quis',
        'nostrud',
        'exercitation',
    ];
    const rand = () => words[Math.floor(Math.random() * words.length)];
    return `${rand()}-${rand()}-${rand()}`;
};

export const getLinks = async (
    req: AuthedRequest,
    res: Response
): Promise<Response> => {
    try {
        const isAdmin = req.user?.role === 'admin';
        const query = isAdmin
            ? 'SELECT * FROM links ORDER BY created_at DESC'
            : 'SELECT * FROM links WHERE affiliate_id = (SELECT id FROM affiliates WHERE user_id = $1) ORDER BY created_at DESC';
        const params = isAdmin ? [] : [req.user?.id];

        const result = await pool.query<LinkRow>(query, params);
        return res.json(result.rows);
    } catch (err) {
        const message = err instanceof Error ? err.message : 'Unknown error';
        return res.status(500).json({ error: message });
    }
};

export const createLink = async (
    req: AuthedRequest,
    res: Response
): Promise<Response> => {
    try {
        const { program_id, original_url } = req.body as CreateLinkBody;

        if (!program_id || !original_url) {
            return res
                .status(400)
                .json({ error: 'program_id and original_url are required' });
        }

        // Check affiliate
        const affiliate = await pool.query<{ id: number }>(
            'SELECT id FROM affiliates WHERE user_id = $1',
            [req.user?.id]
        );
        if (affiliate.rows.length === 0) {
            return res.status(404).json({ error: 'Affiliate not found' });
        }

        const affiliate_id = affiliate.rows[0].id;

        // Check membership
        const membership = await pool.query<{ id: number }>(
            'SELECT id FROM affiliate_programs WHERE affiliate_id = $1 AND program_id = $2',
            [affiliate_id, program_id]
        );
        if (membership.rows.length === 0) {
            return res
                .status(403)
                .json({ error: 'You have not joined this program' });
        }

        // Generate unique slug
        const existing = new Set(
            (
                await pool.query<{ slug: string }>('SELECT slug FROM links')
            ).rows.map((r) => r.slug)
        );
        let slug: string;
        do {
            slug = generateSlug();
        } while (existing.has(slug));

        const result = await pool.query<LinkRow>(
            'INSERT INTO links (affiliate_id, program_id, slug, original_url) VALUES ($1, $2, $3, $4) RETURNING *',
            [affiliate_id, program_id, slug, original_url]
        );
        return res.status(201).json(result.rows[0]);
    } catch (err) {
        const message = err instanceof Error ? err.message : 'Unknown error';
        return res.status(500).json({ error: message });
    }
};

export const deleteLink = async (
    req: AuthedRequest,
    res: Response
): Promise<Response> => {
    try {
        const { id } = req.params;
        const isAdmin = req.user?.role === 'admin';

        const query = isAdmin
            ? 'DELETE FROM links WHERE id = $1 RETURNING *'
            : 'DELETE FROM links WHERE id = $1 AND affiliate_id = (SELECT id FROM affiliates WHERE user_id = $2) RETURNING *';
        const params = isAdmin ? [id] : [id, req.user?.id];

        const result = await pool.query<LinkRow>(query, params);
        if (result.rows.length === 0) {
            return res
                .status(404)
                .json({ error: 'Link not found or unauthorized' });
        }
        return res.json({ message: 'Link deleted successfully' });
    } catch (err) {
        const message = err instanceof Error ? err.message : 'Unknown error';
        return res.status(500).json({ error: message });
    }
};
