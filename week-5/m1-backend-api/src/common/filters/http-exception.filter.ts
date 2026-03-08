import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

interface ValidationErrorDetail {
  field: string;
  message: string;
}

interface ErrorResponseBody {
  success: false;
  message: string;
  error_code: string;
  timestamp: string;
  path: string;
  errors?: ValidationErrorDetail[];
}

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const exceptionResponse =
      exception instanceof HttpException ? exception.getResponse() : null;

    const resObj =
      typeof exceptionResponse === 'object' && exceptionResponse !== null
        ? (exceptionResponse as Record<string, unknown>)
        : {};

    const rawMessage = resObj.message;
    const message =
      typeof rawMessage === 'string'
        ? rawMessage
        : Array.isArray(rawMessage) && typeof rawMessage[0] === 'string'
          ? rawMessage[0]
          : typeof exceptionResponse === 'string'
            ? exceptionResponse
            : 'Somthing went wrong!';

    const errors = Array.isArray(resObj.errors)
      ? (resObj.errors as ValidationErrorDetail[])
      : undefined;

    const body: ErrorResponseBody = {
      success: false,
      message,
      error_code: this.getErrorCode(status, errors),
      timestamp: new Date().toISOString(),
      path: request.originalUrl ?? request.url,
      ...(errors && { errors }),
    };

    if (status >= Number(HttpStatus.INTERNAL_SERVER_ERROR)) {
      const stack = exception instanceof Error ? exception.stack : undefined;
      this.logger.error(
        `${request.method} ${request.originalUrl ?? request.url}`,
        stack,
      );
    }

    response.status(status).json(body);
  }

  private getErrorCode(
    status: number,
    errors?: ValidationErrorDetail[],
  ): string {
    if (
      status === Number(HttpStatus.BAD_REQUEST) &&
      errors &&
      errors.length > 0
    ) {
      return 'VALIDATION_ERROR';
    }

    if (status === Number(HttpStatus.UNAUTHORIZED)) return 'AUTH_401';
    if (status === Number(HttpStatus.FORBIDDEN)) return 'AUTH_403';
    if (status === Number(HttpStatus.NOT_FOUND)) return 'RESOURCE_404';
    if (status === Number(HttpStatus.CONFLICT)) return 'RESOURCE_409';
    if (status === Number(HttpStatus.TOO_MANY_REQUESTS))
      return 'RATE_LIMIT_429';
    if (status >= Number(HttpStatus.INTERNAL_SERVER_ERROR)) return 'SERVER_500';

    return `HTTP_${status}`;
  }
}
