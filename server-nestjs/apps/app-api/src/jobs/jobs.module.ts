import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Story, Connection, Message, User } from '@app/entity';
import { EmailModule } from '@app/external-infra/email';
import { StoryProcessor } from './story.processor';
import { ConnectionProcessor } from './connection.processor';

@Module({
  imports: [
    TypeOrmModule.forFeature([Story, Connection, Message, User]),
    BullModule.registerQueue(
      { name: 'story' },
      { name: 'connection' },
    ),
    EmailModule,
  ],
  providers: [StoryProcessor, ConnectionProcessor],
})
export class JobsModule {}
