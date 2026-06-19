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

const mockClick = {
    id: 1,
    ip_address: '127.0.0.1',
    user_agent: 'Mozilla/5.0',
    clicked_at: new Date(),
    slug: 'lorem-ipsum-dolor',
    original_url: 'https://example.com/products',
    first_name: 'John',
    last_name: 'Doe',
    program_name: 'Nike Partner Program',
};

describe('Clicks Routes', () => {
    afterEach(() => {
        jest.clearAllMocks();
    });

    // GET /api/clicks/go/:slug — public redirect
    describe('GET /api/clicks/go/:slug', () => {
        it('should redirect to original url and log click', async () => {
            pool.query.mockResolvedValueOnce({
                rows: [{ id: 1, original_url: 'https://example.com/products' }],
            }); // find link
            pool.query.mockResolvedValueOnce({ rows: [] }); // insert click

            const res = await request(app).get('/api/clicks/go/lorem-ipsum-dolor');

            expect(res.statusCode).toBe(302);
            expect(res.headers.location).toBe('https://example.com/products');
        });

        it('should return 404 if slug not found', async () => {
            pool.query.mockResolvedValueOnce({ rows: [] });

            const res = await request(app).get('/api/clicks/go/non-existent-slug');

            expect(res.statusCode).toBe(404);
            expect(res.body).toHaveProperty('error', 'Link not found');
        });
    });

    // GET /api/clicks — admin only, sa paginacijom
    describe('GET /api/clicks', () => {
        it('should return paginated clicks as admin', async () => {
            pool.query.mockResolvedValueOnce({ rows: [{ count: '1' }] }); // count
            pool.query.mockResolvedValueOnce({ rows: [mockClick] });       // data

            const res = await request(app)
                .get('/api/clicks?page=1&limit=20')
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

        it('should use default pagination values', async () => {
            pool.query.mockResolvedValueOnce({ rows: [{ count: '0' }] });
            pool.query.mockResolvedValueOnce({ rows: [] });

            const res = await request(app)
                .get('/api/clicks')
                .set('Authorization', `Bearer ${adminToken}`);

            expect(res.statusCode).toBe(200);
            expect(res.body.pagination).toMatchObject({
                page: 1,
                limit: 20,
            });
        });

        it('should fail as affiliate', async () => {
            const res = await request(app)
                .get('/api/clicks')
                .set('Authorization', `Bearer ${userToken}`);

            expect(res.statusCode).toBe(403);
        });

        it('should fail without token', async () => {
            const res = await request(app).get('/api/clicks');
            expect(res.statusCode).toBe(401);
        });
    });

    // GET /api/clicks/affiliate — affiliate vidi svoje klikove
    describe('GET /api/clicks/affiliate', () => {
        it('should return own clicks as affiliate', async () => {
            pool.query.mockResolvedValueOnce({ rows: [{ count: '1' }] }); // count
            pool.query.mockResolvedValueOnce({ rows: [mockClick] });       // data

            const res = await request(app)
                .get('/api/clicks/affiliate')
                .set('Authorization', `Bearer ${userToken}`);

            expect(res.statusCode).toBe(200);
            expect(res.body).toHaveProperty('data');
            expect(res.body).toHaveProperty('pagination');
            expect(res.body.data).toHaveLength(1);
            expect(res.body.data[0]).toHaveProperty('slug', 'lorem-ipsum-dolor');
        });

        it('should return empty data if no clicks', async () => {
            pool.query.mockResolvedValueOnce({ rows: [{ count: '0' }] });
            pool.query.mockResolvedValueOnce({ rows: [] });

            const res = await request(app)
                .get('/api/clicks/affiliate')
                .set('Authorization', `Bearer ${userToken}`);

            expect(res.statusCode).toBe(200);
            expect(res.body.data).toHaveLength(0);
            expect(res.body.pagination.total).toBe(0);
        });

        it('should fail without token', async () => {
            const res = await request(app).get('/api/clicks/affiliate');
            expect(res.statusCode).toBe(401);
        });
    });
});