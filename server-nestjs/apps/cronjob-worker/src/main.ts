import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { CronjobModule } from './cronjob.module';

async function bootstrap() {
  const app = await NestFactory.create(CronjobModule);
  const configService = app.get(ConfigService);

  const port = configService.get<number>('CRONJOB_PORT', 4002);
  await app.listen(port);

  console.log(`Cronjob Worker is running on: http://localhost:${port}`);
}

bootstrap();
