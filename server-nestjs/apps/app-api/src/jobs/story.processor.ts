import { Processor, Process } from '@nestjs/bull';
import { Job } from 'bull';
import { Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Story } from '@app/entity';

@Processor('story')
export class StoryProcessor {
  private readonly logger = new Logger(StoryProcessor.name);

  constructor(
    @InjectRepository(Story)
    private readonly storyRepository: Repository<Story>,
  ) {}

  @Process('delete-story')
  async handleDeleteStory(job: Job<{ storyId: string }>) {
    const { storyId } = job.data;
    this.logger.debug(`Deleting story ${storyId}`);

    try {
      await this.storyRepository.delete(storyId);
      this.logger.log(`Story ${storyId} deleted successfully`);
    } catch (error) {
      this.logger.error(`Failed to delete story ${storyId}: ${error.message}`);
      throw error;
    }
  }
}
