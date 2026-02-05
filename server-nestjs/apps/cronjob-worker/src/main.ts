import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { CronjobModule } from './cronjob.module';
// import { MetricsInterceptor } from '@app/external-infra/prometheus'; // Temporarily disabled

async function bootstrap() {
  const app = await NestFactory.create(CronjobModule);
  const configService = app.get(ConfigService);

  // Global metrics interceptor (Temporarily disabled)
  // app.useGlobalInterceptors(app.get(MetricsInterceptor));

  const port = configService.get<number>('CRONJOB_PORT', 4002);
  await app.listen(port);

  console.log(`Cronjob Worker is running on: http://localhost:${port}`);
}

bootstrap();
