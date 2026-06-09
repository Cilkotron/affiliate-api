const request = require('supertest');
const app = require('../app');
const pool = require('../config/db');

jest.mock('../config/db', () => ({
    query: jest.fn(),
}));

const mockProgram = {
    id: 1,
    name: 'Nike Partner Program',
    description: 'Promote Nike products',
    commission_rate: '10.00',
    status: 'active',
    created_at: new Date(),
};

// Mock valid JWT token
const jwt = require('jsonwebtoken');
const adminToken = jwt.sign(
    { id: 1, role: 'admin' },
    process.env.JWT_SECRET || 'testsecret'
);
const userToken = jwt.sign(
    { id: 2, role: 'affiliate' },
    process.env.JWT_SECRET || 'testsecret'
);

describe('Programs Routes', () => {
    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('GET /api/programs', () => {
        it('should return all programs', async () => {
            pool.query.mockResolvedValueOnce({ rows: [mockProgram] });

            const res = await request(app)
                .get('/api/programs')
                .set('Authorization', `Bearer ${adminToken}`);

            expect(res.statusCode).toBe(200);
            expect(res.body).toHaveLength(1);
            expect(res.body[0]).toHaveProperty('name', 'Nike Partner Program');
        });

        it('should fail without token', async () => {
            const res = await request(app).get('/api/programs');
            expect(res.statusCode).toBe(401);
        });
    });

    describe('GET /api/programs/:id', () => {
        it('should return a single program', async () => {
            pool.query.mockResolvedValueOnce({ rows: [mockProgram] });

            const res = await request(app)
                .get('/api/programs/1')
                .set('Authorization', `Bearer ${adminToken}`);

            expect(res.statusCode).toBe(200);
            expect(res.body).toHaveProperty('id', 1);
        });

        it('should return 404 if program not found', async () => {
            pool.query.mockResolvedValueOnce({ rows: [] });

            const res = await request(app)
                .get('/api/programs/999')
                .set('Authorization', `Bearer ${adminToken}`);

            expect(res.statusCode).toBe(404);
            expect(res.body).toHaveProperty('error', 'Program not found');
        });
    });

    describe('POST /api/programs', () => {
        it('should create a program as admin', async () => {
            pool.query.mockResolvedValueOnce({ rows: [mockProgram] });

            const res = await request(app)
                .post('/api/programs')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({
                    name: 'Nike Partner Program',
                    description: 'Promote Nike products',
                    commission_rate: 10.0,
                    status: 'active',
                });

            expect(res.statusCode).toBe(201);
            expect(res.body).toHaveProperty('name', 'Nike Partner Program');
        });

        it('should fail as affiliate', async () => {
            const res = await request(app)
                .post('/api/programs')
                .set('Authorization', `Bearer ${userToken}`)
                .send({
                    name: 'Test Program',
                    description: 'Test',
                    commission_rate: 10.0,
                });

            expect(res.statusCode).toBe(403);
        });
    });

    describe('PUT /api/programs/:id', () => {
        it('should update a program as admin', async () => {
            pool.query.mockResolvedValueOnce({
                rows: [{ ...mockProgram, name: 'Updated Program' }],
            });

            const res = await request(app)
                .put('/api/programs/1')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({
                    name: 'Updated Program',
                    description: 'Updated description',
                    commission_rate: 15.0,
                    status: 'active',
                });

            expect(res.statusCode).toBe(200);
            expect(res.body).toHaveProperty('name', 'Updated Program');
        });

        it('should return 404 if program not found', async () => {
            pool.query.mockResolvedValueOnce({ rows: [] });

            const res = await request(app)
                .put('/api/programs/999')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({
                    name: 'Updated Program',
                    description: 'Updated description',
                    commission_rate: 15.0,
                    status: 'active',
                });

            expect(res.statusCode).toBe(404);
        });
    });

    describe('DELETE /api/programs/:id', () => {
        it('should delete a program as admin', async () => {
            pool.query.mockResolvedValueOnce({ rows: [mockProgram] });

            const res = await request(app)
                .delete('/api/programs/1')
                .set('Authorization', `Bearer ${adminToken}`);

            expect(res.statusCode).toBe(200);
            expect(res.body).toHaveProperty(
                'message',
                'Program deleted successfully'
            );
        });

        it('should fail as affiliate', async () => {
            const res = await request(app)
                .delete('/api/programs/1')
                .set('Authorization', `Bearer ${userToken}`);

            expect(res.statusCode).toBe(403);
        });
    });
});
