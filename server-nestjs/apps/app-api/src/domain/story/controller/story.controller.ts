import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Body,
  UseGuards,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard, User as CurrentUser } from '@app/shared-libs';
import { StoryService } from '../service/story.service';
import { CreateStoryDto } from '../dto';

interface CurrentUserPayload {
  id: string;
  email: string;
  username: string;
}

@Controller('story')
@UseGuards(JwtAuthGuard)
export class StoryController {
  constructor(private readonly storyService: StoryService) {}

  @Post('create')
  @UseInterceptors(FileInterceptor('media'))
  async createStory(
    @CurrentUser() user: CurrentUserPayload,
    @Body() dto: CreateStoryDto,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    return this.storyService.createStory(user.id, dto, file);
  }

  @Get('get')
  async getStories(@CurrentUser() user: CurrentUserPayload) {
    return this.storyService.getStories(user.id);
  }

  @Post('view/:storyId')
  async viewStory(
    @CurrentUser() user: CurrentUserPayload,
    @Param('storyId') storyId: string,
  ) {
    return this.storyService.viewStory(storyId, user.id);
  }

  @Delete(':storyId')
  async deleteStory(
    @CurrentUser() user: CurrentUserPayload,
    @Param('storyId') storyId: string,
  ) {
    return this.storyService.deleteStory(storyId, user.id);
  }
}
