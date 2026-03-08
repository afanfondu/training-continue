import {
  ArgumentsHost,
  BadRequestException,
  HttpException,
} from '@nestjs/common';
import { HttpExceptionFilter } from './http-exception.filter';

describe('HttpExceptionFilter', () => {
  const createHost = (url = '/api/v1/users', method = 'GET') => {
    const json = jest.fn();
    const status = jest.fn().mockReturnValue({ json });

    const host = {
      switchToHttp: () => ({
        getResponse: () => ({ status }),
        getRequest: () => ({ originalUrl: url, url, method }),
      }),
    } as unknown as ArgumentsHost;

    return { host, status, json };
  };

  it('formats validation errors with module 3 envelope', () => {
    const filter = new HttpExceptionFilter();
    const { host, status, json } = createHost('/api/v1/users');

    const exception = new BadRequestException({
      message: 'Validation failed',
      errors: [
        { field: 'email', message: 'Invalid email format' },
        { field: 'password', message: 'Must be at least 8 characters' },
      ],
    });

    filter.catch(exception, host);

    expect(status).toHaveBeenCalledWith(400);
    expect(json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        message: 'Validation failed',
        error_code: 'VALIDATION_ERROR',
        path: '/api/v1/users',
        errors: [
          { field: 'email', message: 'Invalid email format' },
          { field: 'password', message: 'Must be at least 8 characters' },
        ],
      }),
    );
  });

  it('formats not found errors with resource code', () => {
    const filter = new HttpExceptionFilter();
    const { host, status, json } = createHost('/api/v1/users/999');

    const exception = new HttpException('User with ID 999 not found', 404);
    filter.catch(exception, host);

    expect(status).toHaveBeenCalledWith(404);
    expect(json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        message: 'User with ID 999 not found',
        error_code: 'RESOURCE_404',
        path: '/api/v1/users/999',
      }),
    );
  });

  it('handles unexpected crashes with safe message', () => {
    const filter = new HttpExceptionFilter();
    const { host, status, json } = createHost('/api/v1/users');

    filter.catch(new Error('Database connection pool exhausted'), host);

    expect(status).toHaveBeenCalledWith(500);
    expect(json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        message: 'Service temporarily unavailable',
        error_code: 'SERVER_500',
        path: '/api/v1/users',
      }),
    );
  });
});
