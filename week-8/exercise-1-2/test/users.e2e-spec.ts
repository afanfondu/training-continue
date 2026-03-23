import request from 'supertest';
import { App } from 'supertest/types';
import { INestApplication } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { createTestApp } from './app.e2e-spec';

const REGULAR_USER = {
  email: 'regular@example.com',
  password: 'Password123!',
  firstName: 'Regular',
  lastName: 'User',
};

const ADMIN_USER = {
  email: 'admin@example.com',
  password: 'Password123!',
  firstName: 'Admin',
  lastName: 'User',
  role: 'admin',
};

const OTHER_USER = {
  email: 'other@example.com',
  password: 'Password123!',
  firstName: 'Other',
  lastName: 'User',
};

const NON_EXISTENT_UUID = '00000000-0000-0000-0000-000000000000';

describe('Users (e2e)', () => {
  let app: INestApplication<App>;
  let dataSource: DataSource;

  let regularUserId: string;
  let regularUserToken: string;

  let adminUserId: string;
  let adminUserToken: string;

  let otherUserId: string;
  let otherUserToken: string;

  beforeAll(async () => {
    ({ app, dataSource } = await createTestApp());

    // Register regular user
    const regRes = await request(app.getHttpServer())
      .post('/api/v1/users')
      .send(REGULAR_USER)
      .expect(201);
    regularUserId = regRes.body.data.id;

    const regLoginRes = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email: REGULAR_USER.email, password: REGULAR_USER.password })
      .expect(200);
    regularUserToken = regLoginRes.body.data.access_token;

    // Register admin user
    const adminRes = await request(app.getHttpServer())
      .post('/api/v1/users')
      .send(ADMIN_USER)
      .expect(201);
    adminUserId = adminRes.body.data.id;

    const adminLoginRes = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email: ADMIN_USER.email, password: ADMIN_USER.password })
      .expect(200);
    adminUserToken = adminLoginRes.body.data.access_token;

    // Register other user
    const otherRes = await request(app.getHttpServer())
      .post('/api/v1/users')
      .send(OTHER_USER)
      .expect(201);
    otherUserId = otherRes.body.data.id;

    const otherLoginRes = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email: OTHER_USER.email, password: OTHER_USER.password })
      .expect(200);
    otherUserToken = otherLoginRes.body.data.access_token;
  });

  afterAll(async () => {
    await app.close();
  });

  describe('POST /api/v1/users', () => {
    it('should register successfully', async () => {
      const newUser = {
        email: 'newuser@example.com',
        password: 'Password123!',
        firstName: 'New',
        lastName: 'User',
      };

      const res = await request(app.getHttpServer())
        .post('/api/v1/users')
        .send(newUser)
        .expect(201);

      expect(res.body.success).toBe(true);
      expect(res.body.data).toBeDefined();
      expect(res.body.data.id).toBeDefined();
      expect(res.body.data.email).toBe(newUser.email);
      expect(res.body.data.firstName).toBe(newUser.firstName);
      expect(res.body.data.lastName).toBe(newUser.lastName);
      expect(res.body.data.role).toBe('user');
      expect(res.body.data.password).toBeUndefined();
    });

    it('should fail with missing required fields', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/users')
        .send({})
        .expect(400);

      expect(res.body.success).toBe(false);
      expect(res.body.error_code).toBe('VALIDATION_ERROR');
      expect(res.body.errors).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ field: 'email' }),
          expect.objectContaining({ field: 'password' }),
          expect.objectContaining({ field: 'firstName' }),
          expect.objectContaining({ field: 'lastName' }),
        ]),
      );
    });

    it('should fail with invalid email format', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/users')
        .send({
          email: 'invalid-email',
          password: 'Password123!',
          firstName: 'Test',
          lastName: 'User',
        })
        .expect(400);

      expect(res.body.success).toBe(false);
      expect(res.body.error_code).toBe('VALIDATION_ERROR');
      expect(res.body.errors).toEqual(
        expect.arrayContaining([expect.objectContaining({ field: 'email' })]),
      );
    });

    it('should fail with password too short (< 8 chars)', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/users')
        .send({
          email: 'shortpass@example.com',
          password: 'short',
          firstName: 'Test',
          lastName: 'User',
        })
        .expect(400);

      expect(res.body.success).toBe(false);
      expect(res.body.error_code).toBe('VALIDATION_ERROR');
      expect(res.body.errors).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ field: 'password' }),
        ]),
      );
    });

    it('should fail with duplicate email', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/users')
        .send(REGULAR_USER)
        .expect(409);

      expect(res.body.success).toBe(false);
      expect(res.body.error_code).toBe('RESOURCE_409');
    });
  });

  describe('GET /api/v1/users/:id', () => {
    it('owner can get their own profile', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/v1/users/${regularUserId}`)
        .set('Authorization', `Bearer ${regularUserToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.id).toBe(regularUserId);
      expect(res.body.data.email).toBe(REGULAR_USER.email);
      expect(res.body.data.password).toBeUndefined();
    });

    it('admin can get any user profile', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/v1/users/${regularUserId}`)
        .set('Authorization', `Bearer ${adminUserToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.id).toBe(regularUserId);
      expect(res.body.data.email).toBe(REGULAR_USER.email);
    });

    it('should fail with no token', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/v1/users/${regularUserId}`)
        .expect(401);

      expect(res.body.success).toBe(false);
      expect(res.body.error_code).toBe('AUTH_401');
    });

    it('different (non-admin) user gets 403', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/v1/users/${regularUserId}`)
        .set('Authorization', `Bearer ${otherUserToken}`)
        .expect(403);

      expect(res.body.success).toBe(false);
      expect(res.body.error_code).toBe('AUTH_403');
    });

    it('should fail with non-existent UUID', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/v1/users/${NON_EXISTENT_UUID}`)
        .set('Authorization', `Bearer ${adminUserToken}`)
        .expect(404);

      expect(res.body.success).toBe(false);
      expect(res.body.error_code).toBe('RESOURCE_404');
    });

    it('should fail with invalid UUID format', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/users/not-a-uuid')
        .set('Authorization', `Bearer ${adminUserToken}`)
        .expect(400);

      expect(res.body.success).toBe(false);
      expect(res.body.error_code).toBe('HTTP_400');
    });
  });

  describe('PATCH /api/v1/users/:id', () => {
    it('owner can update their own firstName', async () => {
      const res = await request(app.getHttpServer())
        .patch(`/api/v1/users/${regularUserId}`)
        .set('Authorization', `Bearer ${regularUserToken}`)
        .send({ firstName: 'UpdatedName' })
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.firstName).toBe('UpdatedName');
    });

    it('should fail with validation error (invalid email format)', async () => {
      const res = await request(app.getHttpServer())
        .patch(`/api/v1/users/${regularUserId}`)
        .set('Authorization', `Bearer ${regularUserToken}`)
        .send({ email: 'invalid-email' })
        .expect(400);

      expect(res.body.success).toBe(false);
      expect(res.body.error_code).toBe('VALIDATION_ERROR');
      expect(res.body.errors).toEqual(
        expect.arrayContaining([expect.objectContaining({ field: 'email' })]),
      );
    });

    it('non-admin tries to update role -> role field is silently stripped', async () => {
      const res = await request(app.getHttpServer())
        .patch(`/api/v1/users/${regularUserId}`)
        .set('Authorization', `Bearer ${regularUserToken}`)
        .send({ role: 'admin' })
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.role).toBe('user');
    });

    it('admin CAN update another user role', async () => {
      const res = await request(app.getHttpServer())
        .patch(`/api/v1/users/${otherUserId}`)
        .set('Authorization', `Bearer ${adminUserToken}`)
        .send({ role: 'admin' })
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.role).toBe('admin');
    });

    it('should fail with no token', async () => {
      const res = await request(app.getHttpServer())
        .patch(`/api/v1/users/${regularUserId}`)
        .send({ firstName: 'Test' })
        .expect(401);

      expect(res.body.success).toBe(false);
      expect(res.body.error_code).toBe('AUTH_401');
    });

    it('different (non-admin) user gets 403', async () => {
      const res = await request(app.getHttpServer())
        .patch(`/api/v1/users/${regularUserId}`)
        .set('Authorization', `Bearer ${otherUserToken}`)
        .send({ firstName: 'Test' })
        .expect(403);

      expect(res.body.success).toBe(false);
      expect(res.body.error_code).toBe('AUTH_403');
    });

    it('should fail with non-existent UUID', async () => {
      const res = await request(app.getHttpServer())
        .patch(`/api/v1/users/${NON_EXISTENT_UUID}`)
        .set('Authorization', `Bearer ${adminUserToken}`)
        .send({ firstName: 'Test' })
        .expect(404);

      expect(res.body.success).toBe(false);
      expect(res.body.error_code).toBe('RESOURCE_404');
    });
  });

  describe('DELETE /api/v1/users/:id', () => {
    it('should fail with no token', async () => {
      const res = await request(app.getHttpServer())
        .delete(`/api/v1/users/${regularUserId}`)
        .expect(401);

      expect(res.body.success).toBe(false);
      expect(res.body.error_code).toBe('AUTH_401');
    });

    it('different (non-admin) user gets 403', async () => {
      const res = await request(app.getHttpServer())
        .delete(`/api/v1/users/${regularUserId}`)
        .set('Authorization', `Bearer ${otherUserToken}`)
        .expect(403);

      expect(res.body.success).toBe(false);
      expect(res.body.error_code).toBe('AUTH_403');
    });

    it('should fail with non-existent UUID', async () => {
      const res = await request(app.getHttpServer())
        .delete(`/api/v1/users/${NON_EXISTENT_UUID}`)
        .set('Authorization', `Bearer ${adminUserToken}`)
        .expect(404);

      expect(res.body.success).toBe(false);
      expect(res.body.error_code).toBe('RESOURCE_404');
    });

    it('admin can delete any user', async () => {
      await request(app.getHttpServer())
        .delete(`/api/v1/users/${otherUserId}`)
        .set('Authorization', `Bearer ${adminUserToken}`)
        .expect(204);

      const res = await request(app.getHttpServer())
        .get(`/api/v1/users/${otherUserId}`)
        .set('Authorization', `Bearer ${adminUserToken}`)
        .expect(404);

      expect(res.body.success).toBe(false);
      expect(res.body.error_code).toBe('RESOURCE_404');
    });

    it('owner can delete their own account', async () => {
      await request(app.getHttpServer())
        .delete(`/api/v1/users/${regularUserId}`)
        .set('Authorization', `Bearer ${regularUserToken}`)
        .expect(204);

      const res = await request(app.getHttpServer())
        .get(`/api/v1/users/${regularUserId}`)
        .set('Authorization', `Bearer ${adminUserToken}`)
        .expect(404);

      expect(res.body.success).toBe(false);
      expect(res.body.error_code).toBe('RESOURCE_404');
    });
  });
});
