import { initTracing } from '@app/external-infra/tracing/tracing-sdk';
initTracing('pingup-notification');

import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { NotificationModule } from './notification.module';
// import { MetricsInterceptor } from '@app/external-infra/prometheus'; // Temporarily disabled
import { TracingInterceptor } from '@app/external-infra/tracing';

async function bootstrap() {
  const app = await NestFactory.create(NotificationModule);
  const configService = app.get(ConfigService);

  // Global metrics interceptor (Temporarily disabled)
  // app.useGlobalInterceptors(app.get(MetricsInterceptor));

  // Global tracing interceptor
  app.useGlobalInterceptors(app.get(TracingInterceptor));

  const port = configService.get<number>('NOTIFICATION_PORT', 4001);
  await app.listen(port);

  console.log(`Notification Service is running on: http://localhost:${port}`);
}

bootstrap();
