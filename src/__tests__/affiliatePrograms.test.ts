import request from 'supertest';
import jwt from 'jsonwebtoken';
import app from '../app';

jest.mock('../config/db', () => {
    const mc = {
        query: jest.fn(),
        release: jest.fn(),
    };
    const mp = {
        query: jest.fn(),
        connect: jest.fn().mockResolvedValue(mc),
    };
    return {
        default: mp,
        ...mp,
    };
});

const getMockClient = () => {
    return (pool.connect as jest.Mock).mock.results[0]?.value;
};

const pool = jest.requireMock('../config/db').default;

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
        jest.clearAllMocks();
    });

    describe('POST /api/affiliate-programs/join/:program_id', () => {
        it('should join a program as approved affiliate', async () => {
            const mc = await pool.connect();
            (mc.query as jest.Mock)
                .mockResolvedValueOnce({ rows: [] }) // BEGIN
                .mockResolvedValueOnce({ rows: [{ id: 1 }] }) // affiliate approved
                .mockResolvedValueOnce({ rows: [{ id: 1 }] }) // program active
                .mockResolvedValueOnce({ rows: [] }) // not already joined
                .mockResolvedValueOnce({ rows: [mockAffiliateProgram] }) // insert
                .mockResolvedValueOnce({ rows: [] }); // COMMIT

            const res = await request(app)
                .post('/api/affiliate-programs/join/1')
                .set('Authorization', `Bearer ${userToken}`);

            expect(res.statusCode).toBe(201);
            expect(res.body).toHaveProperty('affiliate_id');
            expect(res.body).toHaveProperty('program_id');
        });

        it('should fail if affiliate not approved', async () => {
            const mc = await pool.connect();
            (mc.query as jest.Mock)
                .mockResolvedValueOnce({ rows: [] }) // BEGIN
                .mockResolvedValueOnce({ rows: [] }) // affiliate not approved
                .mockResolvedValueOnce({ rows: [] }); // ROLLBACK

            const res = await request(app)
                .post('/api/affiliate-programs/join/1')
                .set('Authorization', `Bearer ${userToken}`);

            expect(res.statusCode).toBe(403);
            expect(res.body).toHaveProperty(
                'error',
                'Affiliate not found or not approved'
            );
        });

        it('should fail if program not found or inactive', async () => {
            const mc = await pool.connect();
            (mc.query as jest.Mock)
                .mockResolvedValueOnce({ rows: [] }) // BEGIN
                .mockResolvedValueOnce({ rows: [{ id: 1 }] }) // affiliate ok
                .mockResolvedValueOnce({ rows: [] }) // program not found
                .mockResolvedValueOnce({ rows: [] }); // ROLLBACK

            const res = await request(app)
                .post('/api/affiliate-programs/join/999')
                .set('Authorization', `Bearer ${userToken}`);

            expect(res.statusCode).toBe(404);
            expect(res.body).toHaveProperty(
                'error',
                'Program not found or inactive'
            );
        });

        it('should fail if already joined', async () => {
            const mc = await pool.connect();
            (mc.query as jest.Mock)
                .mockResolvedValueOnce({ rows: [] }) // BEGIN
                .mockResolvedValueOnce({ rows: [{ id: 1 }] }) // affiliate ok
                .mockResolvedValueOnce({ rows: [{ id: 1 }] }) // program ok
                .mockResolvedValueOnce({ rows: [{ id: 1 }] }) // already joined
                .mockResolvedValueOnce({ rows: [] }); // ROLLBACK

            const res = await request(app)
                .post('/api/affiliate-programs/join/1')
                .set('Authorization', `Bearer ${userToken}`);

            expect(res.statusCode).toBe(409);
            expect(res.body).toHaveProperty(
                'error',
                'Already joined this program'
            );
        });

        it('should fail without token', async () => {
            const res = await request(app).post(
                '/api/affiliate-programs/join/1'
            );
            expect(res.statusCode).toBe(401);
        });
    });

    describe('DELETE /api/affiliate-programs/leave/:program_id', () => {
        it('should leave a program as affiliate', async () => {
            (pool.query as jest.Mock)
                .mockResolvedValueOnce({ rows: [{ id: 1 }] })
                .mockResolvedValueOnce({ rows: [mockAffiliateProgram] });

            const res = await request(app)
                .delete('/api/affiliate-programs/leave/1')
                .set('Authorization', `Bearer ${userToken}`);

            expect(res.statusCode).toBe(200);
            expect(res.body).toHaveProperty(
                'message',
                'Left program successfully'
            );
        });

        it('should fail if affiliate not found', async () => {
            (pool.query as jest.Mock).mockResolvedValueOnce({ rows: [] });

            const res = await request(app)
                .delete('/api/affiliate-programs/leave/1')
                .set('Authorization', `Bearer ${userToken}`);

            expect(res.statusCode).toBe(404);
            expect(res.body).toHaveProperty('error', 'Affiliate not found');
        });

        it('should fail if not joined', async () => {
            (pool.query as jest.Mock)
                .mockResolvedValueOnce({ rows: [{ id: 1 }] })
                .mockResolvedValueOnce({ rows: [] });

            const res = await request(app)
                .delete('/api/affiliate-programs/leave/1')
                .set('Authorization', `Bearer ${userToken}`);

            expect(res.statusCode).toBe(404);
            expect(res.body).toHaveProperty('error', 'Not joined this program');
        });

        it('should fail without token', async () => {
            const res = await request(app).delete(
                '/api/affiliate-programs/leave/1'
            );
            expect(res.statusCode).toBe(401);
        });
    });

    describe('GET /api/affiliate-programs', () => {
        it('should return own programs as affiliate', async () => {
            (pool.query as jest.Mock).mockResolvedValueOnce({
                rows: [mockAffiliateProgram],
            });

            const res = await request(app)
                .get('/api/affiliate-programs')
                .set('Authorization', `Bearer ${userToken}`);

            expect(res.statusCode).toBe(200);
            expect(res.body).toHaveLength(1);
            expect(res.body[0]).toHaveProperty('program_id');
        });

        it('should return empty array if no programs', async () => {
            (pool.query as jest.Mock).mockResolvedValueOnce({ rows: [] });

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

    describe('GET /api/affiliate-programs/all', () => {
        it('should return all affiliate programs as admin', async () => {
            (pool.query as jest.Mock).mockResolvedValueOnce({
                rows: [mockAffiliateProgram],
            });

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
