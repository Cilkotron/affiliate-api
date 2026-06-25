const request = require('supertest');
const app = require('../app');
const pool = require('../config/db');
const getMockClient = async () => {
    return await pool.connect();
};

jest.mock('../config/db', () => {
    const mockClient = {
        query: jest.fn(),
        release: jest.fn(),
    };
    return {
        query: jest.fn(),
        connect: jest.fn().mockResolvedValue(mockClient),
    };
});

const jwt = require('jsonwebtoken');
const adminToken = jwt.sign(
    { id: 1, role: 'admin' },
    process.env.JWT_SECRET || 'testsecret'
);
const userToken = jwt.sign(
    { id: 2, role: 'affiliate' },
    process.env.JWT_SECRET || 'testsecret'
);

const mockAffiliateProgram = {
    id: 1,
    affiliate_id: 1,
    program_id: 1,
    joined_at: new Date(),
    program_name: 'Nike Partner Program',
    commission_rate: '10.00',
    status: 'active',
};

describe('Affiliate Programs Routes', () => {
    afterEach(async () => {
        const mockClient = await getMockClient();
        mockClient.query.mockReset();
        jest.clearAllMocks();
    });

    // POST /api/affiliate-programs/join/:program_id
    describe('POST /api/affiliate-programs/join/:program_id', () => {
        it('should join a program as approved affiliate', async () => {
            const mockClient = await getMockClient();
            mockClient.query
                .mockResolvedValueOnce({ rows: [] }) // BEGIN
                .mockResolvedValueOnce({ rows: [{ id: 1 }] }) // affiliate approved
                .mockResolvedValueOnce({ rows: [{ id: 1 }] }) // program active
                .mockResolvedValueOnce({ rows: [] }) // program not active
                .mockResolvedValueOnce({ rows: [mockAffiliateProgram] }) // insert
                .mockResolvedValueOnce({ rows: [] }) // COMMIT

            const res = await request(app)
                .post('/api/affiliate-programs/join/1')
                .set('Authorization', `Bearer ${userToken}`);

            expect(res.statusCode).toBe(201);
            expect(res.body).toHaveProperty('affiliate_id');
            expect(res.body).toHaveProperty('program_id');
        });

        it('should fail if affiliate not approved', async () => {
            const mockClient = await getMockClient();
            mockClient.query
                .mockResolvedValueOnce({ rows: [] }) // BEGIN
                .mockResolvedValueOnce({ rows: [] }) // COMMIT

            const res = await request(app)
                .post('/api/affiliate-programs/join/1')
                .set('Authorization', `Bearer ${userToken}`);

            expect(res.statusCode).toBe(403);
            expect(res.body).toHaveProperty('error', 'Affiliate not found or not approved');
        });

        it('should fail if program not found or inactive', async () => {
            const mockClient = await getMockClient();
            mockClient.query
                .mockResolvedValueOnce({ rows: [] }) // BEGIN
                .mockResolvedValueOnce({ rows: [{ id: 1 }] }) // affiliate ok
                .mockResolvedValueOnce({ rows: [] }) // program not found
                .mockResolvedValueOnce({ rows: [] }) // COMMIT

            const res = await request(app)
                .post('/api/affiliate-programs/join/999')
                .set('Authorization', `Bearer ${userToken}`);

            expect(res.statusCode).toBe(404);
            expect(res.body).toHaveProperty('error', 'Program not found or inactive');
        });

        it('should fail if already joined', async () => {
             const mockClient = await getMockClient();
            mockClient.query
                .mockResolvedValueOnce({ rows: [] }) // BEGIN
                .mockResolvedValueOnce({ rows: [{ id: 1 }] }) // affiliate ok
                .mockResolvedValueOnce({ rows: [{ id: 1 }] }) // program ok 
                .mockResolvedValueOnce({ rows: [{ id: 1 }] }) // already joined
                .mockResolvedValueOnce({ rows: [] }) // COMMIT

            const res = await request(app)
                .post('/api/affiliate-programs/join/1')
                .set('Authorization', `Bearer ${userToken}`);

            expect(res.statusCode).toBe(409);
            expect(res.body).toHaveProperty('error', 'Already joined this program');
        });

        it('should fail without token', async () => {
            const res = await request(app).post('/api/affiliate-programs/join/1');
            expect(res.statusCode).toBe(401);
        });
    });

    // DELETE /api/affiliate-programs/leave/:program_id
    describe('DELETE /api/affiliate-programs/leave/:program_id', () => {
        it('should leave a program as affiliate', async () => {
            pool.query.mockResolvedValueOnce({ rows: [{ id: 1 }] }); // affiliate found
            pool.query.mockResolvedValueOnce({ rows: [mockAffiliateProgram] }); // deleted

            const res = await request(app)
                .delete('/api/affiliate-programs/leave/1')
                .set('Authorization', `Bearer ${userToken}`);

            expect(res.statusCode).toBe(200);
            expect(res.body).toHaveProperty('message', 'Left program successfully');
        });

        it('should fail if affiliate not found', async () => {
            pool.query.mockResolvedValueOnce({ rows: [] });

            const res = await request(app)
                .delete('/api/affiliate-programs/leave/1')
                .set('Authorization', `Bearer ${userToken}`);

            expect(res.statusCode).toBe(404);
            expect(res.body).toHaveProperty('error', 'Affiliate not found');
        });

        it('should fail if not joined', async () => {
            pool.query.mockResolvedValueOnce({ rows: [{ id: 1 }] }); // affiliate found
            pool.query.mockResolvedValueOnce({ rows: [] });           // not joined

            const res = await request(app)
                .delete('/api/affiliate-programs/leave/1')
                .set('Authorization', `Bearer ${userToken}`);

            expect(res.statusCode).toBe(404);
            expect(res.body).toHaveProperty('error', 'Not joined this program');
        });

        it('should fail without token', async () => {
            const res = await request(app).delete('/api/affiliate-programs/leave/1');
            expect(res.statusCode).toBe(401);
        });
    });

    // GET /api/affiliate-programs
    describe('GET /api/affiliate-programs', () => {
        it('should return own programs as affiliate', async () => {
            pool.query.mockResolvedValueOnce({ rows: [mockAffiliateProgram] });

            const res = await request(app)
                .get('/api/affiliate-programs')
                .set('Authorization', `Bearer ${userToken}`);

            expect(res.statusCode).toBe(200);
            expect(res.body).toHaveLength(1);
            expect(res.body[0]).toHaveProperty('program_id');
        });

        it('should return empty array if no programs', async () => {
            pool.query.mockResolvedValueOnce({ rows: [] });

            const res = await request(app)
                .get('/api/affiliate-programs')
                .set('Authorization', `Bearer ${userToken}`);

            expect(res.statusCode).toBe(200);
            expect(res.body).toHaveLength(0);
        });

        it('should fail without token', async () => {
            const res = await request(app).get('/api/affiliate-programs');
            expect(res.statusCode).toBe(401);
        });
    });

    // GET /api/affiliate-programs/all
    describe('GET /api/affiliate-programs/all', () => {
        it('should return all affiliate programs as admin', async () => {
            pool.query.mockResolvedValueOnce({ rows: [mockAffiliateProgram] });

            const res = await request(app)
                .get('/api/affiliate-programs/all')
                .set('Authorization', `Bearer ${adminToken}`);

            expect(res.statusCode).toBe(200);
            expect(res.body).toHaveLength(1);
        });

        it('should fail as affiliate', async () => {
            const res = await request(app)
                .get('/api/affiliate-programs/all')
                .set('Authorization', `Bearer ${userToken}`);

            expect(res.statusCode).toBe(403);
        });

        it('should fail without token', async () => {
            const res = await request(app).get('/api/affiliate-programs/all');
            expect(res.statusCode).toBe(401);
        });
    });
});