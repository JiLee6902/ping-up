import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ThrottlerModule } from '@nestjs/throttler';
import { BullModule } from '@nestjs/bull';

import { dataSourceOptions } from '@app/entity';
import { RedisModule } from '@app/external-infra/redis';
import { WebSocketModule } from '@app/external-infra/websocket';
import { EmailModule } from '@app/external-infra/email';
import { VnpayModule } from '@app/external-infra/vnpay';
import { GroqModule } from '@app/external-infra/groq';

import { AuthModule } from './domain/auth/auth.module';
import { UserModule } from './domain/user/user.module';
import { PostModule } from './domain/post/post.module';
import { MessageModule } from './domain/message/message.module';
import { StoryModule } from './domain/story/story.module';
import { UploadModule } from './domain/upload/upload.module';
import { CommentModule } from './domain/comment/comment.module';
import { NotificationModule } from './domain/notification/notification.module';
import { ReportModule } from './domain/report/report.module';
import { GroupChatModule } from './domain/group-chat/group-chat.module';
import { PaymentModule } from './domain/payment/payment.module';
import { HealthModule } from './health/health.module';
import { JobsModule } from './jobs/jobs.module';

@Module({
  imports: [
    // Config
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: [
        `.env.${process.env.NODE_ENV || 'local'}`,
        '.env.local',
      ],
    }),

    // Database
    TypeOrmModule.forRoot({
      ...dataSourceOptions,
      autoLoadEntities: true,
    }),

    // Rate limiting
    ThrottlerModule.forRoot([
      { name: 'short', ttl: 1000, limit: 10 },
      { name: 'medium', ttl: 10000, limit: 50 },
      { name: 'long', ttl: 60000, limit: 200 },
    ]),

    // Bull Queue
    BullModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        redis: {
          host: configService.get('REDIS_HOST', 'localhost'),
          port: configService.get('REDIS_PORT', 6379),
          password: configService.get('REDIS_PASSWORD', ''),
        },
        defaultJobOptions: {
          removeOnComplete: 100,
          removeOnFail: 50,
          attempts: 3,
          backoff: {
            type: 'exponential',
            delay: 1000,
          },
        },
      }),
      inject: [ConfigService],
    }),

    // External infrastructure
    RedisModule,
    WebSocketModule,
    EmailModule,
    VnpayModule,
    GroqModule,

    // Domain modules
    AuthModule,
    UserModule,
    PostModule,
    MessageModule,
    StoryModule,
    UploadModule,
    CommentModule,
    NotificationModule,
    ReportModule,
    GroupChatModule,
    PaymentModule,

    // Health check
    HealthModule,

    // Background jobs
    JobsModule,
  ],
})
export class AppModule {}
