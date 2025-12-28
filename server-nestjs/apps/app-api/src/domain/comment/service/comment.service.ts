import { Injectable, NotFoundException, ForbiddenException, Inject, forwardRef } from '@nestjs/common';
import { CommentRepository } from '../repository/comment.repository';
import { WebSocketService } from '@app/external-infra/websocket';
import { NotificationService } from '../../notification/service/notification.service';
import { CreateCommentDto } from '../dto';
import { User } from '@app/entity';

@Injectable()
export class CommentService {
  constructor(
    private readonly commentRepository: CommentRepository,
    private readonly webSocketService: WebSocketService,
    @Inject(forwardRef(() => NotificationService))
    private readonly notificationService: NotificationService,
  ) {}

  async addComment(userId: string, dto: CreateCommentDto) {
    const comment = await this.commentRepository.create({
      postId: dto.postId,
      userId,
      content: dto.content.trim(),
      parentId: dto.parentId,
      user: { id: userId } as User,
    });

    const populatedComment = await this.commentRepository.findById(comment.id);

    // Notify post owner if someone else commented on their post
    if (populatedComment?.post?.user && populatedComment.post.user.id !== userId) {
      this.webSocketService.sendPostCommented(populatedComment.post.user.id, {
        postId: dto.postId,
        commentsCount: populatedComment.post.commentsCount,
        comment: {
          id: populatedComment.id,
          content: populatedComment.content,
          user: {
            id: populatedComment.user.id,
            fullName: populatedComment.user.fullName,
            username: populatedComment.user.username,
            profilePicture: populatedComment.user.profilePicture,
          },
          createdAt: populatedComment.createdAt,
        },
      });

      // Create notification
      this.notificationService.createCommentNotification(
        populatedComment.post.user.id,
        userId,
        dto.postId,
        populatedComment.id,
        populatedComment.user.fullName,
      );
    }

    return {
      success: true,
      message: dto.parentId ? 'Reply added' : 'Comment added',
      comment: this.formatCommentResponse(populatedComment),
    };
  }

  async getComments(postId: string, userId: string) {
    const comments = await this.commentRepository.findByPostId(postId);

    // Get all comment IDs (including nested) to check like status
    const getAllCommentIds = (commentList: any[]): string[] => {
      const ids: string[] = [];
      for (const c of commentList) {
        ids.push(c.id);
        if (c.children?.length) {
          ids.push(...getAllCommentIds(c.children));
        }
      }
      return ids;
    };

    const allCommentIds = getAllCommentIds(comments);
    const likeStatusMap = await this.commentRepository.getLikeStatusForComments(userId, allCommentIds);

    return {
      success: true,
      comments: comments.map((c) => this.formatCommentResponse(c, likeStatusMap)),
    };
  }

  async likeComment(userId: string, commentId: string) {
    try {
      const { comment, isLiked } = await this.commentRepository.toggleLike(commentId, userId);

      return {
        success: true,
        message: isLiked ? 'Comment liked' : 'Comment unliked',
        data: {
          commentId: comment.id,
          likesCount: comment.likesCount,
          isLiked,
        },
      };
    } catch (error) {
      throw new NotFoundException('Comment not found');
    }
  }

  async deleteComment(userId: string, commentId: string) {
    const comment = await this.commentRepository.findById(commentId);

    if (!comment) {
      throw new NotFoundException('Comment not found');
    }

    if (comment.userId !== userId) {
      throw new ForbiddenException('You can only delete your own comments');
    }

    await this.commentRepository.delete(commentId, comment.postId);

    return {
      success: true,
      message: 'Comment deleted',
    };
  }

  private formatCommentResponse(comment: any, likeStatusMap?: Map<string, boolean>) {
    if (!comment) return null;

    return {
      id: comment.id,
      content: comment.content,
      parentId: comment.parentId,
      likesCount: comment.likesCount || 0,
      isLiked: likeStatusMap?.get(comment.id) || false,
      createdAt: comment.createdAt,
      user: comment.user
        ? {
            id: comment.user.id,
            fullName: comment.user.fullName,
            username: comment.user.username,
            profilePicture: comment.user.profilePicture,
          }
        : null,
      children: comment.children?.map((child: any) => this.formatCommentResponse(child, likeStatusMap)) || [],
    };
  }
}
