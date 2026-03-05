import { Injectable } from '@nestjs/common';
import { trace, Span, SpanStatusCode, context } from '@opentelemetry/api';

@Injectable()
export class TracingService {
  private readonly tracer = trace.getTracer('pingup-tracer');

  startSpan(name: string): Span {
    return this.tracer.startSpan(name);
  }

  async withSpan<T>(name: string, fn: (span: Span) => Promise<T>): Promise<T> {
    return this.tracer.startActiveSpan(name, async (span) => {
      try {
        const result = await fn(span);
        span.setStatus({ code: SpanStatusCode.OK });
        return result;
      } catch (error) {
        span.setStatus({
          code: SpanStatusCode.ERROR,
          message: error instanceof Error ? error.message : String(error),
        });
        span.recordException(
          error instanceof Error ? error : new Error(String(error)),
        );
        throw error;
      } finally {
        span.end();
      }
    });
  }

  

  getCurrentSpan(): Span | undefined {
    return trace.getSpan(context.active());
  }

  recordError(error: Error): void {
    const span = this.getCurrentSpan();
    if (span) {
      span.setStatus({ code: SpanStatusCode.ERROR, message: error.message });
      span.recordException(error);
    }
  }
}
