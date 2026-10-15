import request from 'supertest';
import app from '../app';
import { prisma } from '../lib/prisma';

describe('News API', () => {
  let adminToken: string;
  let userToken: string;
  let newsId: string;

  beforeAll(async () => {
    const bcrypt = await import('bcrypt');

    // ساخت ادمین
    await prisma.user.create({
      data: {
        email: 'admin@test.com',
        password: await bcrypt.hash('password123', 12),
        name: 'Admin',
        role: 'ADMIN',
      },
    });

    // ساخت کاربر عادی
    await prisma.user.create({
      data: {
        email: 'user@test.com',
        password: await bcrypt.hash('password123', 12),
        name: 'User',
        role: 'USER',
      },
    });

    // گرفتن توکن ادمین
    const adminLogin = await request(app)
      .post('/api/users/login')
      .send({ email: 'admin@test.com', password: 'password123' });
    adminToken = adminLogin.body.data.token;

    // گرفتن توکن کاربر
    const userLogin = await request(app)
      .post('/api/users/login')
      .send({ email: 'user@test.com', password: 'password123' });
    userToken = userLogin.body.data.token;
  });

  describe('POST /api/news', () => {
    it('should create news as admin', async () => {
      const response = await request(app)
        .post('/api/news')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          title: 'Test News',
          content: 'This is a test news content for testing',
        })
        .expect(201);

      expect(response.body.success).toBe(true);
      newsId = response.body.data.id;
    });

    it('should return 403 for non-admin', async () => {
      const response = await request(app)
        .post('/api/news')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          title: 'Test News',
          content: 'This is a test news content',
        })
        .expect(403);

      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/news', () => {
    it('should return list of news', async () => {
      const response = await request(app)
        .get('/api/news')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.news).toBeInstanceOf(Array);
    });
  });

  describe('GET /api/news/:id', () => {
    it('should return news by id', async () => {
      const response = await request(app)
        .get(`/api/news/${newsId}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe(newsId);
    });
  });

  describe('POST /api/news/:id/comments', () => {
    it('should add comment to news', async () => {
      const response = await request(app)
        .post(`/api/news/${newsId}/comments`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({ content: 'Great news!' })
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.content).toBe('Great news!');
    });
  });

  describe('POST /api/news/:id/like', () => {
    it('should toggle like on news', async () => {
      const response = await request(app)
        .post(`/api/news/${newsId}/like`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({ type: 'LIKE' })
        .expect(200);

      expect(response.body.success).toBe(true);
    });
  });

  describe('POST /api/news/:id/rate', () => {
    it('should add rating to news', async () => {
      const response = await request(app)
        .post(`/api/news/${newsId}/rate`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({ value: 5 })
        .expect(200);

      expect(response.body.success).toBe(true);
    });
  });

  describe('DELETE /api/news/:id', () => {
    it('should delete news as admin', async () => {
      await request(app)
        .delete(`/api/news/${newsId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);
    });
  });
});
