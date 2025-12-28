import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BullModule } from '@nestjs/bull';
import { Story, User, Connection } from '@app/entity';
import { StoryController } from './controller/story.controller';
import { StoryService } from './service/story.service';
import { StoryRepository } from './repository/story.repository';

@Module({
  imports: [
    TypeOrmModule.forFeature([Story, User, Connection]),
    BullModule.registerQueue({ name: 'story' }),
  ],
  controllers: [StoryController],
  providers: [StoryService, StoryRepository],
  exports: [StoryService, StoryRepository],
})
export class StoryModule {}
