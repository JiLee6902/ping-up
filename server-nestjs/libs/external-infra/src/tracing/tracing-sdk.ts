import { NodeSDK } from '@opentelemetry/sdk-node';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { HttpInstrumentation } from '@opentelemetry/instrumentation-http';
import { ExpressInstrumentation } from '@opentelemetry/instrumentation-express';
import { PgInstrumentation } from '@opentelemetry/instrumentation-pg';
import { IORedisInstrumentation } from '@opentelemetry/instrumentation-ioredis';
import { resourceFromAttributes } from '@opentelemetry/resources';
import { ATTR_SERVICE_NAME } from '@opentelemetry/semantic-conventions';

let sdk: NodeSDK | undefined;

export function initTracing(serviceName: string): void {
  const enabled = process.env.TRACING_ENABLED !== 'false';
  if (!enabled) {
    console.log(`Tracing disabled for ${serviceName}`);
    return;
  }

  const endpoint =
    process.env.JAEGER_ENDPOINT || 'http://localhost:4318/v1/traces';

  const samplerArg = parseFloat(
    process.env.OTEL_TRACES_SAMPLER_ARG || '1.0',
  );

  const exporter = new OTLPTraceExporter({ url: endpoint });

  sdk = new NodeSDK({
    resource: resourceFromAttributes({
      [ATTR_SERVICE_NAME]: process.env.OTEL_SERVICE_NAME || serviceName,
    }),
    traceExporter: exporter,
    instrumentations: [
      new HttpInstrumentation(),
      new ExpressInstrumentation(),
      new PgInstrumentation(),
      new IORedisInstrumentation(),
    ],
    sampler:
      samplerArg >= 1
        ? undefined // AlwaysOnSampler (default)
        : new (require('@opentelemetry/sdk-trace-base').TraceIdRatioBasedSampler)(
            samplerArg,
          ),
  });

  sdk.start();
  console.log(
    `Tracing initialized for ${serviceName} → ${endpoint} (sample ratio: ${samplerArg})`,
  );

  process.on('SIGTERM', () => {
    sdk
      ?.shutdown()
      .then(() => console.log('Tracing SDK shut down'))
      .catch((err) => console.error('Error shutting down tracing SDK', err));
  });
}
