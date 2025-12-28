import {
  Controller,
  Get,
  Post,
  Delete,
  Put,
  Body,
  Query,
  Param,
  UseGuards,
  UseInterceptors,
  UploadedFiles,
} from '@nestjs/common';
import { FilesInterceptor, FileFieldsInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard, Public, User as CurrentUser } from '@app/shared-libs';
import { PostService } from '../service/post.service';
import { CreatePostDto, LikePostDto, RepostDto, AdvancedSearchDto } from '../dto';

interface CurrentUserPayload {
  id: string;
  email: string;
  username: string;
}

interface UploadedFilesType {
  images?: Express.Multer.File[];
  video?: Express.Multer.File[];
}

@Controller('post')
@UseGuards(JwtAuthGuard)
export class PostController {
  constructor(private readonly postService: PostService) {}

  @Post('add')
  @UseInterceptors(FileFieldsInterceptor([
    { name: 'images', maxCount: 4 },
    { name: 'video', maxCount: 1 },
  ]))
  async addPost(
    @CurrentUser() user: CurrentUserPayload,
    @Body() dto: CreatePostDto,
    @UploadedFiles() files?: UploadedFilesType,
  ) {
    const imageFiles = files?.images;
    const videoFile = files?.video?.[0];
    return this.postService.addPost(user.id, dto, imageFiles, videoFile);
  }

  @Get('feed')
  async getFeedPosts(
    @CurrentUser() user: CurrentUserPayload,
    @Query('limit') limit?: number,
    @Query('offset') offset?: number,
  ) {
    return this.postService.getFeedPosts(user.id, limit, offset);
  }

  @Public()
  @Get('global')
  async getGlobalPosts(
    @CurrentUser() user: CurrentUserPayload | null,
    @Query('limit') limit?: number,
    @Query('offset') offset?: number,
  ) {
    return this.postService.getGlobalPosts(user?.id || null, limit, offset);
  }

  @Get('liked/:userId')
  async getLikedPosts(
    @CurrentUser() user: CurrentUserPayload,
    @Param('userId') targetUserId: string,
    @Query('limit') limit?: number,
    @Query('offset') offset?: number,
  ) {
    return this.postService.getLikedPosts(user.id, targetUserId, limit, offset);
  }

  @Post('like')
  async likePost(
    @CurrentUser() user: CurrentUserPayload,
    @Body() dto: LikePostDto,
  ) {
    return this.postService.likePost(user.id, dto);
  }

  @Post('repost')
  async repost(
    @CurrentUser() user: CurrentUserPayload,
    @Body() dto: RepostDto,
  ) {
    return this.postService.repost(user.id, dto);
  }

  @Post('unrepost')
  async unrepost(
    @CurrentUser() user: CurrentUserPayload,
    @Body() dto: RepostDto,
  ) {
    return this.postService.unrepost(user.id, dto);
  }

  @Delete(':postId')
  async deletePost(
    @CurrentUser() user: CurrentUserPayload,
    @Param('postId') postId: string,
  ) {
    return this.postService.deletePost(user.id, postId);
  }

  @Put(':postId')
  @UseInterceptors(FilesInterceptor('images', 4))
  async updatePost(
    @CurrentUser() user: CurrentUserPayload,
    @Param('postId') postId: string,
    @Body('content') content: string,
    @Body('removedImages') removedImages?: string,
    @UploadedFiles() files?: Express.Multer.File[],
  ) {
    const removedImageUrls = removedImages ? JSON.parse(removedImages) : [];
    return this.postService.updatePost(user.id, postId, content, removedImageUrls, files);
  }

  @Get('search')
  async searchPosts(
    @CurrentUser() user: CurrentUserPayload,
    @Query('q') query: string,
    @Query('limit') limit?: number,
    @Query('offset') offset?: number,
  ) {
    return this.postService.searchPosts(user.id, query, limit, offset);
  }

  @Post('bookmark')
  async toggleBookmark(
    @CurrentUser() user: CurrentUserPayload,
    @Body('postId') postId: string,
  ) {
    return this.postService.toggleBookmark(user.id, postId);
  }

  @Get('saved')
  async getBookmarkedPosts(
    @CurrentUser() user: CurrentUserPayload,
    @Query('limit') limit?: number,
    @Query('offset') offset?: number,
  ) {
    return this.postService.getBookmarkedPosts(user.id, limit, offset);
  }

  @Get('advanced-search')
  async advancedSearchPosts(
    @CurrentUser() user: CurrentUserPayload,
    @Query() dto: AdvancedSearchDto,
  ) {
    return this.postService.advancedSearchPosts(user.id, dto);
  }

  @Get('search/suggestions')
  async getSearchSuggestions(
    @CurrentUser() user: CurrentUserPayload,
    @Query('q') query: string,
  ) {
    return this.postService.getSearchSuggestions(query);
  }
}
