import { Global, Module } from '@nestjs/common';
import {
  PrometheusModule,
  makeCounterProvider,
  makeHistogramProvider,
  makeGaugeProvider,
} from '@willsoto/nestjs-prometheus';
import { MetricsInterceptor } from './metrics.interceptor';

@Global()
@Module({
  imports: [
    PrometheusModule.register({
      defaultMetrics: { enabled: true },
      path: '/metrics',
    }),
  ],
  providers: [
    // HTTP metrics
    makeCounterProvider({
      name: 'http_requests_total',
      help: 'Total number of HTTP requests',
      labelNames: ['method', 'route', 'status_code'],
    }),
    makeHistogramProvider({
      name: 'http_request_duration_seconds',
      help: 'Duration of HTTP requests in seconds',
      labelNames: ['method', 'route', 'status_code'],
      buckets: [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10],
    }),
    makeGaugeProvider({
      name: 'http_requests_in_flight',
      help: 'Number of HTTP requests currently being processed',
    }),
    // WebSocket metrics
    makeGaugeProvider({
      name: 'websocket_connections_active',
      help: 'Number of active WebSocket connections',
    }),
    makeCounterProvider({
      name: 'websocket_events_total',
      help: 'Total number of WebSocket events emitted',
      labelNames: ['event'],
    }),
    MetricsInterceptor,
  ],
  exports: [
    PrometheusModule,
    MetricsInterceptor,
    'prom_metric_http_requests_total',
    'prom_metric_http_request_duration_seconds',
    'prom_metric_http_requests_in_flight',
    'prom_metric_websocket_connections_active',
    'prom_metric_websocket_events_total',
  ],
})
export class MetricsModule {}
