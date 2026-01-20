import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  // Known bot/scanner probe patterns - don't log these 404s
  private readonly probePatterns = [
    /\.env/i,
    /graphql/i,
    /swagger/i,
    /config\.json/i,
    /\/config$/i,
    /\/settings$/i,
    /phpmy/i,
    /wp-admin/i,
    /wp-login/i,
    /\.git/i,
    /\.aws/i,
    /\.docker/i,
    /actuator/i,
    /admin/i,
    /backup/i,
    /debug/i,
    /trace/i,
    /metrics/i,
    /\.xml$/i,
    /\.sql$/i,
    /\.bak$/i,
    /\.log$/i,
  ];

  private isProbeRequest(url: string, status: number): boolean {
    if (status !== HttpStatus.NOT_FOUND) return false;
    return this.probePatterns.some((pattern) => pattern.test(url));
  }

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const errorResponse = this.getErrorResponse(exception, status);

    // Skip logging for known bot/scanner probe requests
    if (!this.isProbeRequest(request.url, status)) {
      this.logger.error(
        `${request.method} ${request.url} - ${status} - ${JSON.stringify(errorResponse)}`,
        exception instanceof Error ? exception.stack : undefined,
      );
    }

    response.status(status).json({
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      method: request.method,
      ...errorResponse,
    });
  }

  private getErrorResponse(exception: unknown, status: number) {
    if (exception instanceof HttpException) {
      const response = exception.getResponse();
      if (typeof response === 'string') {
        return { message: response };
      }
      return response as object;
    }

    if (exception instanceof Error) {
      return {
        message:
          status === HttpStatus.INTERNAL_SERVER_ERROR
            ? 'Internal server error'
            : exception.message,
      };
    }

    return { message: 'Internal server error' };
  }
}
