import request from 'supertest';
import { App } from 'supertest/types';
import { INestApplication } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { createTestApp } from './app.e2e-spec';

const TEST_USER = {
  email: 'auth-test@example.com',
  password: 'Password123!',
  firstName: 'Auth',
  lastName: 'Test',
};

describe('Auth (e2e)', () => {
  let app: INestApplication<App>;
  let dataSource: DataSource;

  beforeAll(async () => {
    ({ app, dataSource } = await createTestApp());
    await request(app.getHttpServer())
      .post('/api/v1/users')
      .send(TEST_USER)
      .expect(201);
  });

  afterAll(async () => {
    await app.close();
  });

  describe('POST /api/v1/auth/login', () => {
    it('should login successfully with valid credentials', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({
          email: TEST_USER.email,
          password: TEST_USER.password,
        })
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(typeof res.body.data.access_token).toBe('string');
    });

    it('should fail with missing email field', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({
          password: TEST_USER.password,
        })

        .expect(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error_code).toBe('VALIDATION_ERROR');
      expect(res.body.errors).toEqual(
        expect.arrayContaining([expect.objectContaining({ field: 'email' })]),
      );
    });

    it('should fail with invalid email format', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({
          email: 'notanemail',
          password: TEST_USER.password,
        })
        .expect(400);

      expect(res.body.success).toBe(false);
      expect(res.body.error_code).toBe('VALIDATION_ERROR');
      expect(res.body.errors).toEqual(
        expect.arrayContaining([expect.objectContaining({ field: 'email' })]),
      );
    });

    it('should fail with missing password field', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({
          email: TEST_USER.email,
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

    it('should fail with empty body', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({})
        .expect(400);

      expect(res.body.success).toBe(false);
      expect(res.body.error_code).toBe('VALIDATION_ERROR');
      expect(res.body.errors).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ field: 'email' }),
          expect.objectContaining({ field: 'password' }),
        ]),
      );
    });

    it('should fail with wrong password', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({
          email: TEST_USER.email,
          password: 'WrongPassword123!',
        })
        .expect(401);

      expect(res.body.success).toBe(false);
      expect(res.body.error_code).toBe('AUTH_401');
      expect(res.body.message).toBe('Invalid credentials');
    });

    it('should fail with non-existent email', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({
          email: 'nonexistent@example.com',
          password: TEST_USER.password,
        })
        .expect(401);

      expect(res.body.success).toBe(false);
      expect(res.body.error_code).toBe('AUTH_401');
      expect(res.body.message).toBe('Invalid credentials');
    });
  });
});
