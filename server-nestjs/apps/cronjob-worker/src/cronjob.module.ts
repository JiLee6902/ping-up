import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { TypeOrmModule } from '@nestjs/typeorm';
import { dataSourceOptions } from '@app/entity';
import { EmailModule } from '@app/external-infra/email';
// import { MetricsModule } from '@app/external-infra/prometheus'; // Temporarily disabled
import { Message, User } from '@app/entity';
import { UnseenMessagesCron } from './unseen-messages.cron';

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
    TypeOrmModule.forFeature([Message, User]),
    ScheduleModule.forRoot(),
    EmailModule,
    // MetricsModule, // Temporarily disabled
  ],
  providers: [UnseenMessagesCron],
})
export class CronjobModule {}
