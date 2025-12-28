import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard, User as CurrentUser } from '@app/shared-libs';
import { CommentService } from '../service/comment.service';
import { CreateCommentDto } from '../dto';

interface CurrentUserPayload {
  id: string;
  email: string;
  username: string;
}

@Controller('comment')
@UseGuards(JwtAuthGuard)
export class CommentController {
  constructor(private readonly commentService: CommentService) {}

  @Post('add')
  async addComment(
    @CurrentUser() user: CurrentUserPayload,
    @Body() dto: CreateCommentDto,
  ) {
    return this.commentService.addComment(user.id, dto);
  }

  @Get(':postId')
  async getComments(
    @CurrentUser() user: CurrentUserPayload,
    @Param('postId') postId: string,
  ) {
    return this.commentService.getComments(postId, user.id);
  }

  @Post('like/:commentId')
  async likeComment(
    @CurrentUser() user: CurrentUserPayload,
    @Param('commentId') commentId: string,
  ) {
    return this.commentService.likeComment(user.id, commentId);
  }

  @Delete(':commentId')
  async deleteComment(
    @CurrentUser() user: CurrentUserPayload,
    @Param('commentId') commentId: string,
  ) {
    return this.commentService.deleteComment(user.id, commentId);
  }
}
