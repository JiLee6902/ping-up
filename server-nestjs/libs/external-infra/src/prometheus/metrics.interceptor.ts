import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { InjectMetric } from '@willsoto/nestjs-prometheus';
import { Counter, Histogram, Gauge } from 'prom-client';
import { Observable, tap } from 'rxjs';
import { Request, Response } from 'express';

@Injectable()
export class MetricsInterceptor implements NestInterceptor {
  constructor(
    @InjectMetric('http_requests_total')
    private readonly requestsTotal: Counter<string>,
    @InjectMetric('http_request_duration_seconds')
    private readonly requestDuration: Histogram<string>,
    @InjectMetric('http_requests_in_flight')
    private readonly requestsInFlight: Gauge<string>,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    if (context.getType() !== 'http') {
      return next.handle();
    }

    const req = context.switchToHttp().getRequest<Request>();
    const route = req.route?.path || req.path;
    const method = req.method;

    this.requestsInFlight.inc();
    const stopTimer = this.requestDuration.startTimer({ method, route });

    return next.handle().pipe(
      tap({
        next: () => {
          const res = context.switchToHttp().getResponse<Response>();
          const statusCode = String(res.statusCode);
          stopTimer({ status_code: statusCode });
          this.requestsTotal.inc({ method, route, status_code: statusCode });
          this.requestsInFlight.dec();
        },
        error: () => {
          const res = context.switchToHttp().getResponse<Response>();
          const statusCode = String(res.statusCode || 500);
          stopTimer({ status_code: statusCode });
          this.requestsTotal.inc({ method, route, status_code: statusCode });
          this.requestsInFlight.dec();
        },
      }),
    );
  }
}
