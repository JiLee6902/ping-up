import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from '@app/shared-libs';
import { MetricsInterceptor } from '@app/external-infra/prometheus';
import { BotBlockerMiddleware } from '@app/shared-libs/middlewares';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);

  // Bot blocker middleware (block malicious scans)
  const botBlocker = new BotBlockerMiddleware();
  app.use(botBlocker.use.bind(botBlocker));

  // CORS
  app.enableCors({
    origin: configService.get<string>('FRONTEND_URL', 'http://localhost:5173'),
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    credentials: true,
  });

  // Global prefix (exclude /metrics for Prometheus scraping)
  app.setGlobalPrefix('api', { exclude: ['metrics'] });

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // Global metrics interceptor
  app.useGlobalInterceptors(app.get(MetricsInterceptor));

  // Global exception filter
  app.useGlobalFilters(new HttpExceptionFilter());

  const port = configService.get<number>('APP_PORT', 4000);
  await app.listen(port);

  console.log(`Application is running on: http://localhost:${port}`);
}

bootstrap();
