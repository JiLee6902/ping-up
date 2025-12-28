import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull } from 'typeorm';
import { Comment, Post, User } from '@app/entity';

@Injectable()
export class CommentRepository {
  constructor(
    @InjectRepository(Comment)
    private readonly commentRepository: Repository<Comment>,
    @InjectRepository(Post)
    private readonly postRepository: Repository<Post>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async create(commentData: Partial<Comment>): Promise<Comment> {
    const comment = this.commentRepository.create(commentData);
    const savedComment = await this.commentRepository.save(comment);

    // Increment comments count on the post
    await this.postRepository.increment(
      { id: commentData.postId },
      'commentsCount',
      1,
    );

    return savedComment;
  }

  async findById(id: string): Promise<Comment | null> {
    return this.commentRepository.findOne({
      where: { id },
      relations: ['user', 'post', 'post.user', 'children', 'children.user'],
    });
  }

  async findByPostId(postId: string): Promise<Comment[]> {
    // Get all comments for the post with user info
    const allComments = await this.commentRepository.find({
      where: { postId },
      relations: ['user'],
      order: { createdAt: 'ASC' },
    });

    // Build tree structure
    const commentMap = new Map<string, Comment>();
    const rootComments: Comment[] = [];

    // First pass: create map of all comments
    for (const comment of allComments) {
      comment.children = [];
      commentMap.set(comment.id, comment);
    }

    // Second pass: build tree
    for (const comment of allComments) {
      if (comment.parentId && commentMap.has(comment.parentId)) {
        commentMap.get(comment.parentId)!.children.push(comment);
      } else if (!comment.parentId) {
        rootComments.push(comment);
      }
    }

    // Sort root comments by createdAt DESC, children by createdAt ASC
    rootComments.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return rootComments;
  }

  async delete(id: string, postId: string): Promise<void> {
    // Count the comment and its children to decrement properly
    const childrenCount = await this.commentRepository.count({
      where: { parentId: id },
    });

    await this.commentRepository.delete(id);

    // Decrement comments count (including children)
    await this.postRepository.decrement(
      { id: postId },
      'commentsCount',
      1 + childrenCount,
    );
  }

  async countByPostId(postId: string): Promise<number> {
    return this.commentRepository.count({ where: { postId } });
  }

  async toggleLike(commentId: string, userId: string): Promise<{ comment: Comment; isLiked: boolean }> {
    const comment = await this.commentRepository.findOne({
      where: { id: commentId },
      relations: ['likes'],
    });

    if (!comment) {
      throw new Error('Comment not found');
    }

    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new Error('User not found');
    }

    const likes = comment.likes || [];
    const isCurrentlyLiked = likes.some((u) => u.id === userId);

    if (isCurrentlyLiked) {
      // Unlike
      comment.likes = likes.filter((u) => u.id !== userId);
      comment.likesCount = Math.max(0, comment.likesCount - 1);
    } else {
      // Like
      comment.likes = [...likes, user];
      comment.likesCount = comment.likesCount + 1;
    }

    await this.commentRepository.save(comment);

    return { comment, isLiked: !isCurrentlyLiked };
  }

  async getLikeStatusForComments(userId: string, commentIds: string[]): Promise<Map<string, boolean>> {
    if (commentIds.length === 0) return new Map();

    const likedComments = await this.commentRepository
      .createQueryBuilder('comment')
      .innerJoin('comment.likes', 'user', 'user.id = :userId', { userId })
      .where('comment.id IN (:...commentIds)', { commentIds })
      .select('comment.id')
      .getMany();

    const likedSet = new Set(likedComments.map(c => c.id));
    const statusMap = new Map<string, boolean>();

    for (const commentId of commentIds) {
      statusMap.set(commentId, likedSet.has(commentId));
    }

    return statusMap;
  }
}
