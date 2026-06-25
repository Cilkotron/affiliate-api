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

const mockConversion = {
    id: 1,
    click_id: 1,
    link_id: 1,
    amount: '100.00',
    commission: '10.00',
    status: 'pending',
    created_at: new Date(),
    first_name: 'John',
    last_name: 'Doe',
    program_name: 'Nike Partner Program',
    slug: 'lorem-ipsum-dolor',
};

describe('Conversions Routes', () => {
    afterEach(async () => {
        const mockClient = await getMockClient();
        mockClient.query.mockReset();
        jest.clearAllMocks();
    });

    // POST /api/conversions — public
    describe('POST /api/conversions', () => {
        it('should create a conversion and calculate commission', async () => {
            const mockClient = await getMockClient();
            mockClient.query
                .mockResolvedValueOnce({ rows: [] }) // BEGIN
                .mockResolvedValueOnce({
                    rows: [{ id: 1, program_id: 1, link_id: 1 }],
                }) // click + link
                .mockResolvedValueOnce({ rows: [] }) // no existing conversion
                .mockResolvedValueOnce({ rows: [{ commission_rate: '10.00' }] }) // program commission rate
                .mockResolvedValueOnce({ rows: [mockConversion] }) // insert
                .mockResolvedValueOnce({ rows: [] }); // COMMIT

            const res = await request(app)
                .post('/api/conversions')
                .send({ click_id: 1, amount: 100.0 });
            console.log(res);

            expect(res.statusCode).toBe(201);
            expect(res.body).toHaveProperty('amount');
            expect(res.body).toHaveProperty('commission');
            expect(res.body).toHaveProperty('status', 'pending');
        });

        it('should fail if click not found', async () => {
            const mockClient = await getMockClient();
            mockClient.query
                .mockResolvedValueOnce({ rows: [] }) // BEGIN
                .mockResolvedValueOnce({ rows: [] }); // COMMIT

            const res = await request(app)
                .post('/api/conversions')
                .send({ click_id: 999, amount: 100.0 });

            expect(res.statusCode).toBe(404);
            expect(res.body).toHaveProperty('error', 'Click not found');
        });

        it('should fail without required fields', async () => {
            const res = await request(app).post('/api/conversions').send({});

            expect(res.statusCode).toBe(400);
            expect(res.body).toHaveProperty(
                'error',
                'click_id and amount are required'
            );
        });
    });

    // GET /api/conversions — admin only
    describe('GET /api/conversions', () => {
        it('should return paginated conversions as admin', async () => {
            pool.query.mockResolvedValueOnce({ rows: [{ count: '1' }] }); // count
            pool.query.mockResolvedValueOnce({ rows: [mockConversion] }); // data

            const res = await request(app)
                .get('/api/conversions?page=1&limit=20')
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
                .get('/api/conversions')
                .set('Authorization', `Bearer ${userToken}`);

            expect(res.statusCode).toBe(403);
        });

        it('should fail without token', async () => {
            const res = await request(app).get('/api/conversions');
            expect(res.statusCode).toBe(401);
        });
    });

    // GET /api/conversions/affiliate — affiliate vidi svoje
    describe('GET /api/conversions/affiliate', () => {
        it('should return own conversions as affiliate', async () => {
            pool.query.mockResolvedValueOnce({ rows: [{ count: '1' }] }); // count
            pool.query.mockResolvedValueOnce({ rows: [mockConversion] }); // data

            const res = await request(app)
                .get('/api/conversions/affiliate')
                .set('Authorization', `Bearer ${userToken}`);

            expect(res.statusCode).toBe(200);
            expect(res.body).toHaveProperty('data');
            expect(res.body).toHaveProperty('pagination');
            expect(res.body.data).toHaveLength(1);
            expect(res.body.data[0]).toHaveProperty('status', 'pending');
        });

        it('should return empty data if no conversions', async () => {
            pool.query.mockResolvedValueOnce({ rows: [{ count: '0' }] });
            pool.query.mockResolvedValueOnce({ rows: [] });

            const res = await request(app)
                .get('/api/conversions/affiliate')
                .set('Authorization', `Bearer ${userToken}`);

            expect(res.statusCode).toBe(200);
            expect(res.body.data).toHaveLength(0);
            expect(res.body.pagination.total).toBe(0);
        });

        it('should fail without token', async () => {
            const res = await request(app).get('/api/conversions/affiliate');
            expect(res.statusCode).toBe(401);
        });
    });

    // PUT /api/conversions/:id/status — admin only
    describe('PUT /api/conversions/:id/status', () => {
        it('should update status to approved as admin', async () => {
            pool.query.mockResolvedValueOnce({
                rows: [{ ...mockConversion, status: 'approved' }],
            });

            const res = await request(app)
                .put('/api/conversions/1/status')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({ status: 'approved' });

            expect(res.statusCode).toBe(200);
            expect(res.body).toHaveProperty('status', 'approved');
        });

        it('should update status to paid as admin', async () => {
            pool.query.mockResolvedValueOnce({
                rows: [{ ...mockConversion, status: 'paid' }],
            });

            const res = await request(app)
                .put('/api/conversions/1/status')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({ status: 'paid' });

            expect(res.statusCode).toBe(200);
            expect(res.body).toHaveProperty('status', 'paid');
        });

        it('should fail with invalid status', async () => {
            const res = await request(app)
                .put('/api/conversions/1/status')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({ status: 'invalid' });

            expect(res.statusCode).toBe(400);
            expect(res.body).toHaveProperty(
                'error',
                'Invalid status. Must be pending, approved, or paid'
            );
        });

        it('should return 404 if conversion not found', async () => {
            pool.query.mockResolvedValueOnce({ rows: [] });

            const res = await request(app)
                .put('/api/conversions/999/status')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({ status: 'approved' });

            expect(res.statusCode).toBe(404);
            expect(res.body).toHaveProperty('error', 'Conversion not found');
        });

        it('should fail as affiliate', async () => {
            const res = await request(app)
                .put('/api/conversions/1/status')
                .set('Authorization', `Bearer ${userToken}`)
                .send({ status: 'approved' });

            expect(res.statusCode).toBe(403);
        });

        it('should fail without token', async () => {
            const res = await request(app)
                .put('/api/conversions/1/status')
                .send({ status: 'approved' });

            expect(res.statusCode).toBe(401);
        });
    });
});
