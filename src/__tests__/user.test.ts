import request from 'supertest';
import app from '../app';
import { prisma } from '../lib/prisma';

beforeEach(async () => {
  await prisma.user.deleteMany({
    where: {
      email: {
        in: ['test@example.com', 'nonexistent@example.com'],
      },
    },
  });
});

describe('Auth & User API', () => {
  // ==================== AUTH TESTS ====================

  describe('POST /api/auth/register', () => {
    it('should register a new user', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'test@example.com',
          password: 'password123',
          name: 'Test User',
        })
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.user.email).toBe('test@example.com');
      expect(response.body.data.user).not.toHaveProperty('password');
      expect(response.body.data.token).toBeDefined();
    });

    it('should return 409 for duplicate email', async () => {
      await prisma.user.create({
        data: {
          email: 'test@example.com',
          password: 'hashed',
          name: 'Test',
        },
      });

      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'test@example.com',
          password: 'password123',
        })
        .expect(409);

      expect(response.body.success).toBe(false);
    });

    it('should return 400 for invalid email', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'invalid-email',
          password: 'password123',
        })
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/auth/login', () => {
    it('should login with valid credentials', async () => {
      const bcrypt = await import('bcrypt');
      await prisma.user.create({
        data: {
          email: 'test@example.com',
          password: await bcrypt.hash('password123', 12),
          name: 'Test',
        },
      });

      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'password123',
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.token).toBeDefined();
    });

    it('should return 401 for invalid credentials', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'nonexistent@example.com',
          password: 'password123',
        })
        .expect(401);

      expect(response.body.success).toBe(false);
    });
  });

  // ==================== USER TESTS ====================

  describe('GET /api/users/me', () => {
    it('should return 401 without token', async () => {
      const response = await request(app)
        .get('/api/users/me')
        .expect(401);

      expect(response.body.success).toBe(false);
    });

    it('should return user profile with valid token', async () => {
      const bcrypt = await import('bcrypt');
      await prisma.user.create({
        data: {
          email: 'test@example.com',
          password: await bcrypt.hash('password123', 12),
          name: 'Test',
        },
      });

      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'password123',
        });

      const token = loginResponse.body.data.token;

      const response = await request(app)
        .get('/api/users/me')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.email).toBe('test@example.com');
    });
  });
});
