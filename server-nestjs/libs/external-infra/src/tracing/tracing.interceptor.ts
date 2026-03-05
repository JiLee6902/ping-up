import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { trace, SpanStatusCode } from '@opentelemetry/api';
import { Observable, tap } from 'rxjs';
import { Request, Response } from 'express';

@Injectable()
export class TracingInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    if (context.getType() !== 'http') {
      return next.handle();
    }

    const req = context.switchToHttp().getRequest<Request>();
    const span = trace.getActiveSpan();

    if (!span) {
      return next.handle();
    }

    const route = req.route?.path || req.path;
    const method = req.method;
    const userId = (req as any).user?.id || (req as any).user?.sub;

    span.updateName(`${method} ${route}`);
    span.setAttribute('http.method', method);
    span.setAttribute('http.route', route);
    span.setAttribute('http.url', req.originalUrl);
    if (userId) {
      span.setAttribute('user.id', userId);
    }

    return next.handle().pipe(
      tap({
        next: () => {
          const res = context.switchToHttp().getResponse<Response>();
          span.setAttribute('http.status_code', res.statusCode);
          span.setStatus({ code: SpanStatusCode.OK });
        },
        error: (error) => {
          const res = context.switchToHttp().getResponse<Response>();
          const statusCode = res.statusCode || 500;
          span.setAttribute('http.status_code', statusCode);
          span.setStatus({
            code: SpanStatusCode.ERROR,
            message: error?.message || 'Unknown error',
          });
          span.recordException(error);
        },
      }),
    );
  }
}
