import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
} from '@nestjs/common';
import { Response } from 'express';

@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const status = exception.getStatus() ?? 500;
    const exceptionResponse = exception.getResponse();

    // Extract error messages (handles validation pipe array format)
    let message: string;
    let errors: string[] | undefined;

    if (typeof exceptionResponse === 'object' && exceptionResponse !== null) {
      const res = exceptionResponse as any;
      message = res.message;

      if (Array.isArray(res.message)) {
        errors = res.message;
        message = 'Validation failed';
      }
    } else {
      message = String(exceptionResponse);
    }

    response.status(status).json({
      success: false,
      statusCode: status,
      message,
      ...(errors && { errors }),
    });
  }
}
