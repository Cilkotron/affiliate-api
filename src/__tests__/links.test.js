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

const mockLink = {
    id: 1,
    affiliate_id: 1,
    program_id: 1,
    slug: 'lorem-ipsum-dolor',
    original_url: 'https://example.com/products',
    program_name: 'Nike Partner Program',
    created_at: new Date(),
};

describe('Links Routes', () => {
    afterEach(() => {
        jest.clearAllMocks();
    });

    // GET /api/links — only admin
    describe('GET /api/links', () => {
        it('should return all links as admin', async () => {
            pool.query.mockResolvedValueOnce({ rows: [mockLink] });

            const res = await request(app)
                .get('/api/links')
                .set('Authorization', `Bearer ${adminToken}`);

            expect(res.statusCode).toBe(200);
            expect(res.body).toHaveLength(1);
            expect(res.body[0]).toHaveProperty('slug', 'lorem-ipsum-dolor');
        });

        it('should fail as affiliate', async () => {
            const res = await request(app)
                .get('/api/links')
                .set('Authorization', `Bearer ${userToken}`);

            expect(res.statusCode).toBe(403);
        });

        it('should fail without token', async () => {
            const res = await request(app).get('/api/links');
            expect(res.statusCode).toBe(401);
        });
    });

    // GET /api/links/affiliate — affiliate links
    describe('GET /api/links/affiliate', () => {
        it('should return own links as affiliate', async () => {
            pool.query.mockResolvedValueOnce({ rows: [mockLink] });

            const res = await request(app)
                .get('/api/links/affiliate')
                .set('Authorization', `Bearer ${userToken}`);

            expect(res.statusCode).toBe(200);
            expect(res.body).toHaveLength(1);
            expect(res.body[0]).toHaveProperty('slug', 'lorem-ipsum-dolor');
        });

        it('should fail without token', async () => {
            const res = await request(app).get('/api/links/affiliate');
            expect(res.statusCode).toBe(401);
        });
    });

    // POST /api/links
    describe('POST /api/links', () => {
        it('should create a link as approved affiliate', async () => {
            pool.query.mockResolvedValueOnce({ rows: [{ id: 1 }] }); // affiliate found
            pool.query.mockResolvedValueOnce({ rows: [{ id: 1 }] }); // membership ok
            pool.query.mockResolvedValueOnce({ rows: [] }); // existing slugs
            pool.query.mockResolvedValueOnce({ rows: [mockLink] }); // insert

            const res = await request(app)
                .post('/api/links')
                .set('Authorization', `Bearer ${userToken}`)
                .send({
                    program_id: 1,
                    original_url: 'https://example.com/products',
                });

            expect(res.statusCode).toBe(201);
            expect(res.body).toHaveProperty('slug');
            expect(res.body).toHaveProperty(
                'original_url',
                'https://example.com/products'
            );
        });

        it('should fail if affiliate not found', async () => {
            pool.query.mockResolvedValueOnce({ rows: [] }); // affiliate not found

            const res = await request(app)
                .post('/api/links')
                .set('Authorization', `Bearer ${userToken}`)
                .send({
                    program_id: 1,
                    original_url: 'https://example.com/products',
                });

            expect(res.statusCode).toBe(404);
            expect(res.body).toHaveProperty('error', 'Affiliate not found');
        });

        it('should fail if not joined program', async () => {
            pool.query.mockResolvedValueOnce({ rows: [{ id: 1 }] }); // affiliate found
            pool.query.mockResolvedValueOnce({ rows: [] }); // membership not found

            const res = await request(app)
                .post('/api/links')
                .set('Authorization', `Bearer ${userToken}`)
                .send({
                    program_id: 1,
                    original_url: 'https://example.com/products',
                });

            expect(res.statusCode).toBe(403);
            expect(res.body).toHaveProperty(
                'error',
                'You have not joined this program'
            );
        });

        it('should fail without required fields', async () => {
            const res = await request(app)
                .post('/api/links')
                .set('Authorization', `Bearer ${userToken}`)
                .send({});

            expect(res.statusCode).toBe(400);
            expect(res.body).toHaveProperty(
                'error',
                'program_id and original_url are required'
            );
        });

        it('should fail without token', async () => {
            const res = await request(app)
                .post('/api/links')
                .send({ program_id: 1, original_url: 'https://example.com' });

            expect(res.statusCode).toBe(401);
        });
    });

    // DELETE /api/links/:id — only admin
    describe('DELETE /api/links/:id', () => {
        it('should delete any link as admin', async () => {
            pool.query.mockResolvedValueOnce({ rows: [mockLink] });

            const res = await request(app)
                .delete('/api/links/1')
                .set('Authorization', `Bearer ${adminToken}`);

            expect(res.statusCode).toBe(200);
            expect(res.body).toHaveProperty(
                'message',
                'Link deleted successfully'
            );
        });

        it('should fail as affiliate', async () => {
            const res = await request(app)
                .delete('/api/links/1')
                .set('Authorization', `Bearer ${userToken}`);

            expect(res.statusCode).toBe(403);
        });

        it('should return 404 if link not found', async () => {
            pool.query.mockResolvedValueOnce({ rows: [] });

            const res = await request(app)
                .delete('/api/links/999')
                .set('Authorization', `Bearer ${adminToken}`);

            expect(res.statusCode).toBe(404);
            expect(res.body).toHaveProperty(
                'error',
                'Link not found or unauthorized'
            );
        });

        it('should fail without token', async () => {
            const res = await request(app).delete('/api/links/1');
            expect(res.statusCode).toBe(401);
        });
    });

    // DELETE /api/links/affiliate/:id — affiliate links
    describe('DELETE /api/links/affiliate/:id', () => {
        it('should delete own link as affiliate', async () => {
            pool.query.mockResolvedValueOnce({ rows: [mockLink] });

            const res = await request(app)
                .delete('/api/links/affiliate/1')
                .set('Authorization', `Bearer ${userToken}`);

            expect(res.statusCode).toBe(200);
            expect(res.body).toHaveProperty(
                'message',
                'Link deleted successfully'
            );
        });

        it('should return 404 if link not found or not owned', async () => {
            pool.query.mockResolvedValueOnce({ rows: [] });

            const res = await request(app)
                .delete('/api/links/affiliate/999')
                .set('Authorization', `Bearer ${userToken}`);

            expect(res.statusCode).toBe(404);
            expect(res.body).toHaveProperty(
                'error',
                'Link not found or unauthorized'
            );
        });

        it('should fail without token', async () => {
            const res = await request(app).delete('/api/links/affiliate/1');
            expect(res.statusCode).toBe(401);
        });
    });
});
