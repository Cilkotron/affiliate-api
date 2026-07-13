import type { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import pool from '../config/db';

type JwtPayload = {
    id: number;
    role: string;
};

type RegisterBody = {
    email: string;
    password: string;
    role?: string;
};

type LoginBody = {
    email: string;
    password: string;
};

type UserRow = {
    id: number;
    email: string;
    role: string;
    password?: string;
};

export const register = async (
    req: Request<Record<string, never>, unknown, RegisterBody>,
    res: Response
): Promise<Response | void> => {
    try {
        const { email, password, role = 'affiliate' } = req.body;

        const userExists = await pool.query<UserRow>(
            'SELECT id FROM users WHERE email = $1',
            [email]
        );
        if (userExists.rows.length > 0) {
            return res.status(400).json({ error: 'Email already exists' });
        }

        const passwordHash = await bcrypt.hash(password, 10);

        const result = await pool.query<UserRow>(
            'INSERT INTO users (email, password, role) VALUES ($1, $2, $3) RETURNING id, email, role',
            [email, passwordHash, role]
        );

        const user = result.rows[0];

        const secret = process.env.JWT_SECRET;
        if (!secret) {
            return res.status(500).json({ error: 'JWT_SECRET is not configured' });
        }

        const token = jwt.sign(
            { id: user.id, role: user.role } satisfies JwtPayload,
            secret,
            { expiresIn: '7d' }
        );

        return res.status(201).json({ user, token });
    } catch (err) {
        const message = err instanceof Error ? err.message : 'Unknown error';
        return res.status(500).json({ error: message });
    }
};

export const login = async (
    req: Request<Record<string, never>, unknown, LoginBody>,
    res: Response
): Promise<Response | void> => {
    try {
        const { email, password } = req.body;

        const result = await pool.query<UserRow>(
            'SELECT * FROM users WHERE email = $1',
            [email]
        );
        if (result.rows.length === 0) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }

        const user = result.rows[0];
        if (!user.password) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }

        const valid = await bcrypt.compare(password, user.password);
        if (!valid) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }

        const secret = process.env.JWT_SECRET;
        if (!secret) {
            return res.status(500).json({ error: 'JWT_SECRET is not configured' });
        }

        const token = jwt.sign(
            { id: user.id, role: user.role } satisfies JwtPayload,
            secret,
            { expiresIn: '7d' }
        );

        return res.json({
            user: { id: user.id, email: user.email, role: user.role },
            token,
        });
    } catch (err) {
        const message = err instanceof Error ? err.message : 'Unknown error';
        return res.status(500).json({ error: message });
    }
};