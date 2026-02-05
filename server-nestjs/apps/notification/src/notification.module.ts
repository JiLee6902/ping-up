import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BullModule } from '@nestjs/bull';
import { dataSourceOptions } from '@app/entity';
import { User } from '@app/entity';
import { EmailModule } from '@app/external-infra/email';
// import { MetricsModule } from '@app/external-infra/prometheus'; // Temporarily disabled
import { NOTIFICATION_QUEUE } from '@app/external-infra/queue';
import { NotificationProcessor } from './notification.processor';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: [
        `.env.${process.env.NODE_ENV || 'local'}`,
        '.env.local',
      ],
    }),
    TypeOrmModule.forRoot({
      ...dataSourceOptions,
      autoLoadEntities: true,
    }),
    TypeOrmModule.forFeature([User]),
    BullModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        redis: {
          host: configService.get<string>('REDIS_HOST', 'localhost'),
          port: configService.get<number>('REDIS_PORT', 6379),
          password: configService.get<string>('REDIS_PASSWORD', ''),
        },
      }),
      inject: [ConfigService],
    }),
    BullModule.registerQueue({
      name: NOTIFICATION_QUEUE,
    }),
    EmailModule,
    // MetricsModule, // Temporarily disabled
  ],
  providers: [NotificationProcessor],
})
export class NotificationModule {}
