import request from 'supertest';
import { App } from 'supertest/types';
import { INestApplication } from '@nestjs/common';
import { createTestApp } from './app.e2e-spec';
import { ApiResponse } from './utils/test-types';

const ADMIN_USER = {
  email: 'admin-list@example.com',
  password: 'Password123!',
  firstName: 'Admin',
  lastName: 'User',
  role: 'admin',
};

const REGULAR_USER_1 = {
  email: 'user1-list@example.com',
  password: 'Password123!',
  firstName: 'Regular',
  lastName: 'One',
};

const REGULAR_USER_2 = {
  email: 'user2-list@example.com',
  password: 'Password123!',
  firstName: 'Regular',
  lastName: 'Two',
};

const REGULAR_USER_3 = {
  email: 'user3-list@example.com',
  password: 'Password123!',
  firstName: 'Regular',
  lastName: 'Three',
};

const DISTINCT_USER = {
  email: 'zephyr-list@example.com',
  password: 'Password123!',
  firstName: 'Zephyr',
  lastName: 'Wind',
};

describe('Users Admin (e2e)', () => {
  let app: INestApplication;
  let adminToken: string;
  let regularUserToken: string;

  beforeAll(async () => {
    const testApp = await createTestApp();
    app = testApp.app;

    // Register admin user
    await request(app.getHttpServer() as App)
      .post('/api/v1/users')
      .send(ADMIN_USER)
      .expect(201);

    const adminLoginRes = await request(app.getHttpServer() as App)
      .post('/api/v1/auth/login')
      .send({ email: ADMIN_USER.email, password: ADMIN_USER.password })
      .expect(200);
    const adminLoginBody = adminLoginRes.body as unknown as ApiResponse;
    adminToken = adminLoginBody.data.access_token as string;

    // Register regular user 1
    await request(app.getHttpServer() as App)
      .post('/api/v1/users')
      .send(REGULAR_USER_1)
      .expect(201);

    const regLoginRes = await request(app.getHttpServer() as App)
      .post('/api/v1/auth/login')
      .send({ email: REGULAR_USER_1.email, password: REGULAR_USER_1.password })
      .expect(200);
    const regLoginBody = regLoginRes.body as unknown as ApiResponse;
    regularUserToken = regLoginBody.data.access_token as string;

    // Register regular user 2
    await request(app.getHttpServer() as App)
      .post('/api/v1/users')
      .send(REGULAR_USER_2)
      .expect(201);

    // Register regular user 3
    await request(app.getHttpServer() as App)
      .post('/api/v1/users')
      .send(REGULAR_USER_3)
      .expect(201);

    // Register distinct user
    await request(app.getHttpServer() as App)
      .post('/api/v1/users')
      .send(DISTINCT_USER)
      .expect(201);
  });

  afterAll(async () => {
    await app.close();
  });

  describe('GET /api/v1/users', () => {
    it('Admin gets paginated list', async () => {
      const res = await request(app.getHttpServer() as App)
        .get('/api/v1/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      const body = res.body as unknown as ApiResponse;
      expect(body.success).toBe(true);
      expect(Array.isArray(body.data.users)).toBe(true);
      expect(body.data.meta).toBeDefined();
      expect(body.data.meta).toHaveProperty('page');
      expect(body.data.meta).toHaveProperty('limit');
      expect(body.data.meta).toHaveProperty('total');
      expect(body.data.meta).toHaveProperty('totalPages');
    });

    it('meta fields are numbers', async () => {
      const res = await request(app.getHttpServer() as App)
        .get('/api/v1/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      const body = res.body as unknown as ApiResponse;
      expect(typeof body.data.meta.page).toBe('number');
      expect(typeof body.data.meta.limit).toBe('number');
      expect(typeof body.data.meta.total).toBe('number');
      expect(typeof body.data.meta.totalPages).toBe('number');
    });

    it('No token -> 401', async () => {
      const res = await request(app.getHttpServer() as App)
        .get('/api/v1/users')
        .expect(401);

      const body = res.body as unknown as ApiResponse;
      expect(body.success).toBe(false);
      expect(body.error_code).toBe('AUTH_401');
    });

    it('Non-admin user token -> 403', async () => {
      const res = await request(app.getHttpServer() as App)
        .get('/api/v1/users')
        .set('Authorization', `Bearer ${regularUserToken}`)
        .expect(403);

      const body = res.body as unknown as ApiResponse;
      expect(body.success).toBe(false);
      expect(body.error_code).toBe('AUTH_403');
    });

    it('page query param', async () => {
      const res = await request(app.getHttpServer() as App)
        .get('/api/v1/users?page=1&limit=2')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      const body = res.body as unknown as ApiResponse;
      expect(body.data.users.length).toBeLessThanOrEqual(2);
      expect(body.data.meta.limit).toBe(2);
      expect(body.data.meta.page).toBe(1);
    });

    it('limit query param', async () => {
      const res = await request(app.getHttpServer() as App)
        .get('/api/v1/users?limit=1')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      const body = res.body as unknown as ApiResponse;
      expect(body.data.users.length).toBe(1);
      expect(body.data.meta.limit).toBe(1);
    });

    it('search query param', async () => {
      const res = await request(app.getHttpServer() as App)
        .get('/api/v1/users?search=Zephyr')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      const body = res.body as unknown as ApiResponse;
      expect(body.data.users.length).toBeGreaterThanOrEqual(1);
      const hasZephyr = body.data.users.some((u: any) =>
        (u.firstName as string).includes('Zephyr'),
      );
      expect(hasZephyr).toBe(true);
    });

    it('role filter', async () => {
      const res = await request(app.getHttpServer() as App)
        .get('/api/v1/users?role=admin')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      const body = res.body as unknown as ApiResponse;
      expect(body.data.users.length).toBeGreaterThanOrEqual(1);
      const allAdmins = body.data.users.every((u: any) => u.role === 'admin');
      expect(allAdmins).toBe(true);
    });

    it('sortOrder=ASC', async () => {
      const res = await request(app.getHttpServer() as App)
        .get('/api/v1/users?sortOrder=ASC')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      const body = res.body as unknown as ApiResponse;
      expect(body.success).toBe(true);
    });

    it('sortBy=email', async () => {
      const res = await request(app.getHttpServer() as App)
        .get('/api/v1/users?sortBy=email')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      const body = res.body as unknown as ApiResponse;
      expect(body.success).toBe(true);
    });
  });
});
