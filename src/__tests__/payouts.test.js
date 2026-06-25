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

const mockPayout = {
    id: 1,
    affiliate_id: 1,
    amount: '50.00',
    status: 'pending',
    paid_at: null,
    first_name: 'John',
    last_name: 'Doe',
};

describe('Payouts Routes', () => {
    afterEach(async () => {
        const mockClient = await getMockClient();
        mockClient.query.mockReset();
        jest.clearAllMocks();
    });

    // POST /api/payouts
    describe('POST /api/payouts', () => {
        it('should create a payout as affiliate', async () => {
            const mockClient = await getMockClient();
            mockClient.query
                .mockResolvedValueOnce({ rows: [] })              // BEGIN
                .mockResolvedValueOnce({ rows: [{ id: 1 }] })    // affiliate found
                .mockResolvedValueOnce({ rows: [{ total: '100.00' }] }) // commissions
                .mockResolvedValueOnce({ rows: [mockPayout] })    // insert
                .mockResolvedValueOnce({ rows: [] });             // COMMIT

            const res = await request(app)
                .post('/api/payouts')
                .set('Authorization', `Bearer ${userToken}`)
                .send({ amount: 50.0 });

            expect(res.statusCode).toBe(201);
            expect(res.body).toHaveProperty('amount');
            expect(res.body).toHaveProperty('status', 'pending');
        });

        it('should create a payout as admin for specific affiliate', async () => {
            const mockClient = await getMockClient();
            mockClient.query
                .mockResolvedValueOnce({ rows: [] }) // BEGIN
                .mockResolvedValueOnce({ rows: [{ id: 1 }] }) // affiliate found
                .mockResolvedValueOnce({ rows: [{ total: '100.00' }] }) // commissions
                .mockResolvedValueOnce({ rows: [mockPayout] }) // insert
                .mockResolvedValueOnce({ rows: [] }); // COMMIT

            const res = await request(app)
                .post('/api/payouts')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({ affiliate_id: 1, amount: 50.0 });

            expect(res.statusCode).toBe(201);
            expect(res.body).toHaveProperty('status', 'pending');
        });

        it('should fail if affiliate not found', async () => {
            const mockClient = await getMockClient();
            mockClient.query
                .mockResolvedValueOnce({ rows: [] })  // BEGIN
                .mockResolvedValueOnce({ rows: [] })  // affiliate not found
                .mockResolvedValueOnce({ rows: [] }); // ROLLBACK

            const res = await request(app)
                .post('/api/payouts')
                .set('Authorization', `Bearer ${userToken}`)
                .send({ amount: 50.0 });

            expect(res.statusCode).toBe(404);
            expect(res.body).toHaveProperty('error', 'Affiliate not found');
        });

        it('should fail if insufficient commissions', async () => {
            const mockClient = await getMockClient();
            mockClient.query
                .mockResolvedValueOnce({ rows: [] }) // BEGIN
                .mockResolvedValueOnce({ rows: [{ id: 1 }] }) // affiliate found
                .mockResolvedValueOnce({ rows: [{ total: '10.00' }] }) // insufficient
                .mockResolvedValueOnce({ rows: [] }); // ROLLBACK

            const res = await request(app)
                .post('/api/payouts')
                .set('Authorization', `Bearer ${userToken}`)
                .send({ amount: 50.0 });

            expect(res.statusCode).toBe(400);
            expect(res.body.error).toContain(
                'Insufficient approved commissions'
            );
        });

        it('should fail without amount', async () => {
            const mockClient = await getMockClient();
            mockClient.query
                .mockResolvedValueOnce({ rows: [] }) // BEGIN
                .mockResolvedValueOnce({ rows: [{ id: 1 }] }) // affiliate found
                .mockResolvedValueOnce({ rows: [] }); // ROLLBACK

            const res = await request(app)
                .post('/api/payouts')
                .set('Authorization', `Bearer ${userToken}`)
                .send({});

            expect(res.statusCode).toBe(400);
            expect(res.body).toHaveProperty('error', 'amount is required');
        });

        it('should fail without token', async () => {
            const res = await request(app)
                .post('/api/payouts')
                .send({ amount: 50.0 });

            expect(res.statusCode).toBe(401);
        });
    });

    // GET /api/payouts — admin only
    describe('GET /api/payouts', () => {
        it('should return paginated payouts as admin', async () => {
            pool.query.mockResolvedValueOnce({ rows: [{ count: '1' }] }); // count
            pool.query.mockResolvedValueOnce({ rows: [mockPayout] }); // data

            const res = await request(app)
                .get('/api/payouts')
                .set('Authorization', `Bearer ${adminToken}`);

            expect(res.statusCode).toBe(200);
            expect(res.body).toHaveProperty('data');
            expect(res.body).toHaveProperty('pagination');
            expect(res.body.data).toHaveLength(1);
            expect(res.body.pagination).toMatchObject({
                total: 1,
                page: 1,
                limit: 20,
                pages: 1,
            });
        });

        it('should fail as affiliate', async () => {
            const res = await request(app)
                .get('/api/payouts')
                .set('Authorization', `Bearer ${userToken}`);

            expect(res.statusCode).toBe(403);
        });

        it('should fail without token', async () => {
            const res = await request(app).get('/api/payouts');
            expect(res.statusCode).toBe(401);
        });
    });

    // GET /api/payouts/affiliate
    describe('GET /api/payouts/affiliate', () => {
        it('should return own payouts as affiliate', async () => {
            pool.query.mockResolvedValueOnce({ rows: [{ count: '1' }] }); // count
            pool.query.mockResolvedValueOnce({ rows: [mockPayout] }); // data

            const res = await request(app)
                .get('/api/payouts/affiliate')
                .set('Authorization', `Bearer ${userToken}`);

            expect(res.statusCode).toBe(200);
            expect(res.body).toHaveProperty('data');
            expect(res.body).toHaveProperty('pagination');
            expect(res.body.data).toHaveLength(1);
            expect(res.body.data[0]).toHaveProperty('status', 'pending');
        });

        it('should return empty data if no payouts', async () => {
            pool.query.mockResolvedValueOnce({ rows: [{ count: '0' }] });
            pool.query.mockResolvedValueOnce({ rows: [] });

            const res = await request(app)
                .get('/api/payouts/affiliate')
                .set('Authorization', `Bearer ${userToken}`);

            expect(res.statusCode).toBe(200);
            expect(res.body.data).toHaveLength(0);
            expect(res.body.pagination.total).toBe(0);
        });

        it('should fail without token', async () => {
            const res = await request(app).get('/api/payouts/affiliate');
            expect(res.statusCode).toBe(401);
        });
    });

    // PUT /api/payouts/:id/status — admin only
    describe('PUT /api/payouts/:id/status', () => {
        it('should update status to paid as admin', async () => {
            const mockClient = await getMockClient();
            mockClient.query
                .mockResolvedValueOnce({ rows: [] }) // BEGIN
                .mockResolvedValueOnce({ rows: [{ id: 1, status: 'pending' }] }) // lock payout
                .mockResolvedValueOnce({ rows: [{ ...mockPayout, status: 'paid', paid_at: new Date() }] }) // update
                .mockResolvedValueOnce({ rows: [] }); 

            const res = await request(app)
                .put('/api/payouts/1/status')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({ status: 'paid' });

            expect(res.statusCode).toBe(200);
            expect(res.body).toHaveProperty('status', 'paid');
            expect(res.body).toHaveProperty('paid_at');
        });

        it('should fail with invalid status', async () => {
            const res = await request(app)
                .put('/api/payouts/1/status')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({ status: 'invalid' });

            expect(res.statusCode).toBe(400);
            expect(res.body).toHaveProperty(
                'error',
                'Invalid status. Must be paid'
            );
        });

        it('should return 404 if payout not found', async () => {
            const mockClient = await getMockClient();
            mockClient.query
                .mockResolvedValueOnce({ rows: [] }) // BEGIN
                .mockResolvedValueOnce({ rows: [] })  // payout not found
                .mockResolvedValueOnce({ rows: [] }); // ROLLBACK

            const res = await request(app)
                .put('/api/payouts/999/status')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({ status: 'paid' });

            expect(res.statusCode).toBe(404);
            expect(res.body).toHaveProperty('error', 'Payout not found');
        });

        it('should fail as affiliate', async () => {
            const res = await request(app)
                .put('/api/payouts/1/status')
                .set('Authorization', `Bearer ${userToken}`)
                .send({ status: 'paid' });

            expect(res.statusCode).toBe(403);
        });

        it('should fail without token', async () => {
            const res = await request(app)
                .put('/api/payouts/1/status')
                .send({ status: 'paid' });

            expect(res.statusCode).toBe(401);
        });
    });
});
