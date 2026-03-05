import { trace, SpanStatusCode } from '@opentelemetry/api';

export function Trace(operationName?: string): MethodDecorator {
  return (
    target: any,
    propertyKey: string | symbol,
    descriptor: PropertyDescriptor,
  ) => {
    const originalMethod = descriptor.value;
    const spanName =
      operationName || `${target.constructor.name}.${String(propertyKey)}`;

    descriptor.value = function (...args: any[]) {
      const tracer = trace.getTracer('pingup-tracer');
      return tracer.startActiveSpan(spanName, (span) => {
        try {
          const result = originalMethod.apply(this, args);

          // Handle promises
          if (result instanceof Promise) {
            return result
              .then((res) => {
                span.setStatus({ code: SpanStatusCode.OK });
                span.end();
                return res;
              })
              .catch((err) => {
                span.setStatus({
                  code: SpanStatusCode.ERROR,
                  message: err?.message,
                });
                span.recordException(err);
                span.end();
                throw err;
              });
          }

          span.setStatus({ code: SpanStatusCode.OK });
          span.end();
          return result;
        } catch (error) {
          span.setStatus({
            code: SpanStatusCode.ERROR,
            message: error instanceof Error ? error.message : String(error),
          });
          span.recordException(
            error instanceof Error ? error : new Error(String(error)),
          );
          span.end();
          throw error;
        }
      });
    };

    return descriptor;
  };
}
