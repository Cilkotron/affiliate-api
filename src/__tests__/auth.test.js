const request = require('supertest');
const app = require('../app');
const pool = require('../config/db');

jest.mock('../config/db', () => ({
	query: jest.fn(),
}));

describe('Auth Routes', () => {
	afterEach(() => {
		jest.clearAllMocks();
	});

	describe('POST /api/auth/register', () => {
		it('should register a new user', async () => {
			pool.query.mockResolvedValueOnce({ rows: [] });
			pool.query.mockResolvedValueOnce({
				rows: [{ id: 1, email: 'test@test.com', role: 'affiliate' }],
			});

			const res = await request(app)
				.post('/api/auth/register')
				.send({ email: 'test@test.com', password: 'password123' });

			expect(res.statusCode).toBe(201);
			expect(res.body).toHaveProperty('token');
			expect(res.body.user).toHaveProperty('email');
		});

		it('should fail if email already exists', async () => {
			pool.query.mockResolvedValueOnce({
				rows: [{ id: 1, email: 'test@test.com' }],
			});

			const res = await request(app)
				.post('/api/auth/register')
				.send({ email: 'test@test.com', password: 'password123' });

			expect(res.statusCode).toBe(400);
			expect(res.body).toHaveProperty('error', 'Email already exists');
		});
	});

	describe('POST /api/auth/login', () => {
		it('should login with valid credentials', async () => {
			const bcrypt = require('bcryptjs');
			const hash = await bcrypt.hash('password123', 10);

			pool.query.mockResolvedValueOnce({
				rows: [
					{ id: 1, email: 'test@test.com', role: 'affiliate', password: hash },
				],
			});

			const res = await request(app)
				.post('/api/auth/login')
				.send({ email: 'test@test.com', password: 'password123' });

			expect(res.statusCode).toBe(200);
			expect(res.body).toHaveProperty('token');
		});

		it('should fail with invalid password', async () => {
			const bcrypt = require('bcryptjs');
			const hash = await bcrypt.hash('password123', 10);

			pool.query.mockResolvedValueOnce({
				rows: [
					{ id: 1, email: 'test@test.com', role: 'affiliate', password: hash },
				],
			});

			const res = await request(app)
				.post('/api/auth/login')
				.send({ email: 'test@test.com', password: 'wrongpassword' });

			expect(res.statusCode).toBe(401);
			expect(res.body).toHaveProperty('error', 'Invalid email or password');
		});

		it('should fail if user does not exist', async () => {
			pool.query.mockResolvedValueOnce({ rows: [] });

			const res = await request(app)
				.post('/api/auth/login')
				.send({ email: 'nouser@test.com', password: 'password123' });

			expect(res.statusCode).toBe(401);
			expect(res.body).toHaveProperty('error', 'Invalid email or password');
		});
	});
});
