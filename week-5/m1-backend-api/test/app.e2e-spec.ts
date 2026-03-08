import request from 'supertest';
import { App } from 'supertest/types';
import { Test, TestingModule } from '@nestjs/testing';
import {
  INestApplication,
  BadRequestException,
  ValidationPipe,
} from '@nestjs/common';
import { DataSource } from 'typeorm';
import { ValidationError } from 'class-validator';
import { AppModule } from '../src/app.module';
import { HttpExceptionFilter } from '../src/common/filters/http-exception.filter';
import { TransformInterceptor } from '../src/common/interceptors/transform.interceptor';
import { clearDatabase } from './utils/db-cleanup.util';

/**
 * Creates and initializes a NestJS test application configured for end-to-end tests and clears the database.
 *
 * The initialized app uses the global API prefix, a validation pipe that formats validation errors into a standardized BadRequestException, a transform interceptor, and an HTTP exception filter. The connected TypeORM DataSource is cleared before returning.
 *
 * @returns An object with `app` — the initialized INestApplication instance, and `dataSource` — the connected TypeORM DataSource
 */
export async function createTestApp(): Promise<{
  app: INestApplication;
  dataSource: DataSource;
}> {
  const moduleFixture: TestingModule = await Test.createTestingModule({
    imports: [AppModule],
  }).compile();

  const app = moduleFixture.createNestApplication();

  app.setGlobalPrefix('api/v1');
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
      exceptionFactory: (validationErrors: ValidationError[] = []) => {
        const errors = validationErrors.flatMap((validationError) => {
          const field = validationError.property;
          const constraints = validationError.constraints;
          if (!constraints) {
            return [];
          }
          return Object.values(constraints).map((message) => ({
            field,
            message,
          }));
        });
        return new BadRequestException({
          message: 'Validation failed',
          errors,
        });
      },
    }),
  );
  app.useGlobalInterceptors(new TransformInterceptor());
  app.useGlobalFilters(new HttpExceptionFilter());

  await app.init();

  const dataSource = app.get(DataSource);
  await clearDatabase(dataSource);

  return { app, dataSource };
}

describe('AppController (e2e)', () => {
  let app: INestApplication<App>;
  let dataSource: DataSource;

  beforeAll(async () => {
    const testApp = await createTestApp();
    app = testApp.app;
    dataSource = testApp.dataSource;
  });

  afterAll(async () => {
    await app.close();
  });

  it('GET /api/v1 returns Hello World with success envelope', async () => {
    const res = await request(app.getHttpServer()).get('/api/v1').expect(200);

    expect(res.body).toEqual({ success: true, data: 'Hello World!' });
  });
});
