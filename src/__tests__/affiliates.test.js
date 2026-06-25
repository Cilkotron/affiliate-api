const request = require('supertest');
const app = require('../app');
const pool = require('../config/db');

jest.mock('../config/db', () => ({
    query: jest.fn(),
}));

const jwt = require('jsonwebtoken');
const adminToken = jwt.sign(
    { id: 1, role: 'admin' },
    process.env.JWT_SECRET || 'testsecret'
);
const userToken = jwt.sign(
    { id: 2, role: 'affiliate' },
    process.env.JWT_SECRET || 'testsecret'
);

const mockAffiliate = {
    id: 1,
    user_id: 2,
    first_name: 'Sanja',
    last_name: 'Budić',
    website: 'https://sanja.com',
    status: 'approved',
    email: 'sanja@test.com',
    created_at: new Date(),
};

describe('Affiliates Routes', () => {
    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('GET /api/affiliates', () => {
        it('should return all affiliates as admin', async () => {
            pool.query.mockResolvedValueOnce({ rows: [mockAffiliate] });

            const res = await request(app)
                .get('/api/affiliates')
                .set('Authorization', `Bearer ${adminToken}`);

            expect(res.statusCode).toBe(200);
            expect(res.body).toHaveLength(1);
            expect(res.body[0]).toHaveProperty('first_name', 'Sanja');
        });

        it('should fail as affiliate', async () => {
            const res = await request(app)
                .get('/api/affiliates')
                .set('Authorization', `Bearer ${userToken}`);

            expect(res.statusCode).toBe(403);
        });

        it('should fail without token', async () => {
            const res = await request(app).get('/api/affiliates');
            expect(res.statusCode).toBe(401);
        });
    });

    describe('GET /api/affiliates/:id', () => {
        it('should return a single affiliate', async () => {
            pool.query.mockResolvedValueOnce({ rows: [mockAffiliate] });

            const res = await request(app)
                .get('/api/affiliates/1')
                .set('Authorization', `Bearer ${adminToken}`);

            expect(res.statusCode).toBe(200);
            expect(res.body).toHaveProperty('id', 1);
        });

        it('should return 404 if affiliate not found', async () => {
            pool.query.mockResolvedValueOnce({ rows: [] });

            const res = await request(app)
                .get('/api/affiliates/999')
                .set('Authorization', `Bearer ${adminToken}`);

            expect(res.statusCode).toBe(404);
            expect(res.body).toHaveProperty('error', 'Affiliate not found');
        });
    });

    describe('POST /api/affiliates', () => {
        it('should create affiliate profile', async () => {
            pool.query.mockResolvedValueOnce({ rows: [] }); // no existing profile
            pool.query.mockResolvedValueOnce({ rows: [mockAffiliate] }); // insert

            const res = await request(app)
                .post('/api/affiliates')
                .set('Authorization', `Bearer ${userToken}`)
                .send({
                    first_name: 'Sanja',
                    last_name: 'Budić',
                    website: 'https://sanja.com',
                });

            expect(res.statusCode).toBe(201);
            expect(res.body).toHaveProperty('first_name', 'Sanja');
        });

        it('should fail if profile already exists', async () => {
            pool.query.mockResolvedValueOnce({ rows: [mockAffiliate] }); // already exists

            const res = await request(app)
                .post('/api/affiliates')
                .set('Authorization', `Bearer ${userToken}`)
                .send({
                    first_name: 'Sanja',
                    last_name: 'Budić',
                    website: 'https://sanja.com',
                });

            expect(res.statusCode).toBe(400);
            expect(res.body).toHaveProperty(
                'error',
                'Affiliate profile already exists'
            );
        });
    });

    describe('PUT /api/affiliates/:id', () => {
        it('should update affiliate status as admin', async () => {
            pool.query.mockResolvedValueOnce({ rows: [{ id: 1 }] }); // check exists
            pool.query.mockResolvedValueOnce({
                rows: [{ ...mockAffiliate, status: 'approved' }],
            }); //update

            const res = await request(app)
                .put('/api/affiliates/1')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({ status: 'approved', version: 2 });

            expect(res.statusCode).toBe(200);
            expect(res.body).toHaveProperty('status', 'approved');
        });

        it('should fail as affiliate', async () => {
            const res = await request(app)
                .put('/api/affiliates/1')
                .set('Authorization', `Bearer ${userToken}`)
                .send({ status: 'approved' });

            expect(res.statusCode).toBe(403);
        });

        it('should return 404 if affiliate not found', async () => {
            pool.query.mockResolvedValueOnce({ rows: [] });

            const res = await request(app)
                .put('/api/affiliates/999')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({ status: 'approved', version: 1 });

            expect(res.statusCode).toBe(404);
        });
    });

    describe('DELETE /api/affiliates/:id', () => {
        it('should delete affiliate as admin', async () => {
            pool.query.mockResolvedValueOnce({ rows: [mockAffiliate] });

            const res = await request(app)
                .delete('/api/affiliates/1')
                .set('Authorization', `Bearer ${adminToken}`);

            expect(res.statusCode).toBe(200);
            expect(res.body).toHaveProperty(
                'message',
                'Affiliate deleted successfully'
            );
        });

        it('should fail as affiliate', async () => {
            const res = await request(app)
                .delete('/api/affiliates/1')
                .set('Authorization', `Bearer ${userToken}`);

            expect(res.statusCode).toBe(403);
        });
    });
});
