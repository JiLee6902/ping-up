import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { NotificationModule } from './notification.module';

async function bootstrap() {
  const app = await NestFactory.create(NotificationModule);
  const configService = app.get(ConfigService);

  const port = configService.get<number>('NOTIFICATION_PORT', 4001);
  await app.listen(port);

  console.log(`Notification Service is running on: http://localhost:${port}`);
}

bootstrap();
