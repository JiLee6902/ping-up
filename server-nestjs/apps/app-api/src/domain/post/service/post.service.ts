import { Injectable, NotFoundException, BadRequestException, ForbiddenException, Inject, forwardRef } from '@nestjs/common';
import { PostRepository } from '../repository/post.repository';
import { UploadService } from '../../upload/service/upload.service';
import { WebSocketService } from '@app/external-infra/websocket';
import { NotificationService } from '../../notification/service/notification.service';
import { CreatePostDto, LikePostDto, RepostDto, AdvancedSearchDto } from '../dto';
import { PostType } from '@app/enum';
import { User } from '@app/entity';

const MAX_IMAGES_PER_POST = 4;
const MAX_VIDEO_SIZE_MB = 100;
const VIDEO_MIME_TYPES = ['video/mp4', 'video/quicktime', 'video/webm', 'video/x-msvideo'];

@Injectable()
export class PostService {
  constructor(
    private readonly postRepository: PostRepository,
    private readonly uploadService: UploadService,
    private readonly webSocketService: WebSocketService,
    @Inject(forwardRef(() => NotificationService))
    private readonly notificationService: NotificationService,
  ) {}

  async addPost(
    userId: string,
    dto: CreatePostDto,
    files?: Express.Multer.File[],
    videoFile?: Express.Multer.File,
  ) {
    if (!dto.content && (!files || files.length === 0) && !videoFile) {
      throw new BadRequestException('Post must have content, images, or video');
    }

    // Cannot have both images and video in the same post
    if (files && files.length > 0 && videoFile) {
      throw new BadRequestException('Cannot have both images and video in the same post');
    }

    if (files && files.length > MAX_IMAGES_PER_POST) {
      throw new BadRequestException(`Maximum ${MAX_IMAGES_PER_POST} images allowed per post`);
    }

    // Validate video file
    if (videoFile) {
      if (!VIDEO_MIME_TYPES.includes(videoFile.mimetype)) {
        throw new BadRequestException('Invalid video format. Supported: MP4, MOV, WebM, AVI');
      }
      if (videoFile.size > MAX_VIDEO_SIZE_MB * 1024 * 1024) {
        throw new BadRequestException(`Video size must be less than ${MAX_VIDEO_SIZE_MB}MB`);
      }
    }

    // Upload images
    const imageUrls: string[] = [];
    if (files && files.length > 0) {
      for (const file of files) {
        const result = await this.uploadService.uploadPostImage(file);
        imageUrls.push(result.url);
      }
    }

    // Upload video
    let videoUrl: string | undefined;
    if (videoFile) {
      const result = await this.uploadService.uploadPostVideo(videoFile);
      videoUrl = result.url;
    }

    // Determine post type
    let postType = dto.postType;
    if (!postType) {
      if (videoUrl) {
        postType = dto.content ? PostType.TEXT_WITH_VIDEO : PostType.VIDEO;
      } else if (dto.content && imageUrls.length > 0) {
        postType = PostType.TEXT_WITH_IMAGE;
      } else if (imageUrls.length > 0) {
        postType = PostType.IMAGE;
      } else {
        postType = PostType.TEXT;
      }
    }

    const post = await this.postRepository.create({
      user: { id: userId } as User,
      content: dto.content,
      imageUrls,
      videoUrl,
      postType,
      likesCount: 0,
      location: dto.location,
      locationLat: dto.locationLat,
      locationLng: dto.locationLng,
    });

    return {
      success: true,
      message: 'Post created successfully',
      data: this.formatPostResponse(post, userId),
    };
  }

  async getFeedPosts(userId: string, limit?: number | string, offset?: number | string) {
    const parsedLimit = limit ? parseInt(String(limit), 10) : 50;
    const parsedOffset = offset ? parseInt(String(offset), 10) : 0;

    const posts = await this.postRepository.getFeedPosts(userId, parsedLimit, parsedOffset);

    // Get repost status for all original posts in feed
    const originalPostIds = posts
      .filter(p => p.postType !== PostType.REPOST)
      .map(p => p.id);
    const allPostIds = posts.map(p => p.id);

    const [repostStatusMap, bookmarkStatusMap] = await Promise.all([
      this.postRepository.getRepostStatusForPosts(userId, originalPostIds),
      this.postRepository.getBookmarkStatusForPosts(userId, allPostIds),
    ]);

    return {
      success: true,
      data: posts.map((post) => this.formatPostResponse(post, userId, repostStatusMap, bookmarkStatusMap)),
    };
  }

  async getGlobalPosts(userId: string | null, limit?: number | string, offset?: number | string) {
    const parsedLimit = limit ? parseInt(String(limit), 10) : 50;
    const parsedOffset = offset ? parseInt(String(offset), 10) : 0;

    const posts = await this.postRepository.getGlobalPosts(parsedLimit, parsedOffset);

    // If user is authenticated, get repost and bookmark status
    let repostStatusMap = new Map<string, boolean>();
    let bookmarkStatusMap = new Map<string, boolean>();

    if (userId) {
      const originalPostIds = posts
        .filter(p => p.postType !== PostType.REPOST)
        .map(p => p.id);
      const allPostIds = posts.map(p => p.id);

      [repostStatusMap, bookmarkStatusMap] = await Promise.all([
        this.postRepository.getRepostStatusForPosts(userId, originalPostIds),
        this.postRepository.getBookmarkStatusForPosts(userId, allPostIds),
      ]);
    }

    return {
      success: true,
      data: posts.map((post) => this.formatPostResponse(post, userId, repostStatusMap, bookmarkStatusMap)),
    };
  }

  async getLikedPosts(userId: string, targetUserId: string, limit?: number | string, offset?: number | string) {
    const parsedLimit = limit ? parseInt(String(limit), 10) : 50;
    const parsedOffset = offset ? parseInt(String(offset), 10) : 0;

    const posts = await this.postRepository.getLikedPosts(targetUserId, parsedLimit, parsedOffset);

    // Get repost status for all original posts
    const originalPostIds = posts
      .filter(p => p.postType !== PostType.REPOST)
      .map(p => p.id);
    const allPostIds = posts.map(p => p.id);

    const [repostStatusMap, bookmarkStatusMap] = await Promise.all([
      this.postRepository.getRepostStatusForPosts(userId, originalPostIds),
      this.postRepository.getBookmarkStatusForPosts(userId, allPostIds),
    ]);

    return {
      success: true,
      data: posts.map((post) => this.formatPostResponse(post, userId, repostStatusMap, bookmarkStatusMap)),
    };
  }

  async likePost(userId: string, dto: LikePostDto) {
    try {
      const { post, isLiked, likerUser } = await this.postRepository.toggleLike(dto.postId, userId);

      // Notify post owner if someone else liked their post
      if (post.user && post.user.id !== userId) {
        if (isLiked) {
          // Send real-time update
          this.webSocketService.sendPostLiked(post.user.id, {
            postId: post.id,
            likesCount: post.likesCount,
            likedBy: {
              id: likerUser.id,
              fullName: likerUser.fullName,
              username: likerUser.username,
              profilePicture: likerUser.profilePicture,
            },
          });
          // Create notification
          this.notificationService.createLikeNotification(
            post.user.id,
            userId,
            post.id,
            likerUser.fullName,
          );
        } else {
          // Remove notification when unliked
          this.notificationService.removeLikeNotification(post.user.id, userId, post.id);
        }
      }

      return {
        success: true,
        message: isLiked ? 'Post liked' : 'Post unliked',
        data: {
          postId: post.id,
          likesCount: post.likesCount,
          isLiked,
        },
      };
    } catch (error) {
      throw new NotFoundException('Post not found');
    }
  }

  async repost(userId: string, dto: RepostDto) {
    const post = await this.postRepository.findById(dto.postId);

    if (!post) {
      throw new NotFoundException('Post not found');
    }

    // If the post is a repost, share the original post instead
    const targetPostId = post.postType === PostType.REPOST && post.originalPostId
      ? post.originalPostId
      : dto.postId;

    // Check if user already reposted this post
    const existingRepost = await this.postRepository.findExistingRepost(
      userId,
      targetPostId,
    );

    if (existingRepost) {
      throw new BadRequestException('You have already shared this post');
    }

    // Don't allow reposting your own post
    const targetPost = targetPostId === dto.postId ? post : await this.postRepository.findById(targetPostId);
    if (targetPost?.user?.id === userId) {
      throw new BadRequestException('You cannot share your own post');
    }

    const { reposterUser } = await this.postRepository.createRepost(userId, targetPostId);

    // Create notification for the post owner
    if (targetPost?.user?.id) {
      this.notificationService.createRepostNotification(
        targetPost.user.id,
        userId,
        targetPostId,
        reposterUser.fullName,
      );
    }

    return {
      success: true,
      message: 'Post shared successfully',
    };
  }

  async unrepost(userId: string, dto: RepostDto) {
    const post = await this.postRepository.findById(dto.postId);

    if (!post) {
      throw new NotFoundException('Post not found');
    }

    // If the post is a repost, target the original post
    const targetPostId = post.postType === PostType.REPOST && post.originalPostId
      ? post.originalPostId
      : dto.postId;

    // Find user's repost of this post
    const existingRepost = await this.postRepository.findExistingRepost(
      userId,
      targetPostId,
    );

    if (!existingRepost) {
      throw new BadRequestException('You have not shared this post');
    }

    await this.postRepository.deleteRepost(existingRepost.id, targetPostId);

    return {
      success: true,
      message: 'Repost removed successfully',
    };
  }

  async deletePost(userId: string, postId: string) {
    const post = await this.postRepository.findById(postId);

    if (!post) {
      throw new NotFoundException('Post not found');
    }

    if (post.user.id !== userId) {
      throw new ForbiddenException('You can only delete your own posts');
    }

    await this.postRepository.deletePost(postId);

    return {
      success: true,
      message: 'Post deleted successfully',
    };
  }

  async updatePost(
    userId: string,
    postId: string,
    content: string,
    removedImageUrls: string[] = [],
    files?: Express.Multer.File[],
  ) {
    const post = await this.postRepository.findById(postId);

    if (!post) {
      throw new NotFoundException('Post not found');
    }

    if (post.user.id !== userId) {
      throw new ForbiddenException('You can only edit your own posts');
    }

    if (post.postType === PostType.REPOST) {
      throw new BadRequestException('Cannot edit a repost');
    }

    // Handle image updates
    let updatedImageUrls = post.imageUrls || [];

    // Remove images that user wants to delete
    if (removedImageUrls.length > 0) {
      updatedImageUrls = updatedImageUrls.filter(url => !removedImageUrls.includes(url));
    }

    // Add new images
    if (files && files.length > 0) {
      const totalImages = updatedImageUrls.length + files.length;
      if (totalImages > MAX_IMAGES_PER_POST) {
        throw new BadRequestException(`Maximum ${MAX_IMAGES_PER_POST} images allowed per post`);
      }

      for (const file of files) {
        const result = await this.uploadService.uploadPostImage(file);
        updatedImageUrls.push(result.url);
      }
    }

    // Validate post still has content or images
    if (!content && updatedImageUrls.length === 0) {
      throw new BadRequestException('Post must have content or images');
    }

    // Determine new post type
    let postType = post.postType;
    if (content && updatedImageUrls.length > 0) {
      postType = PostType.TEXT_WITH_IMAGE;
    } else if (updatedImageUrls.length > 0) {
      postType = PostType.IMAGE;
    } else {
      postType = PostType.TEXT;
    }

    const updatedPost = await this.postRepository.updatePost(postId, {
      content,
      imageUrls: updatedImageUrls,
      postType,
    });

    return {
      success: true,
      message: 'Post updated successfully',
      data: this.formatPostResponse(updatedPost, userId),
    };
  }

  async searchPosts(userId: string, query: string, limit?: number | string, offset?: number | string) {
    const parsedLimit = limit ? parseInt(String(limit), 10) : 50;
    const parsedOffset = offset ? parseInt(String(offset), 10) : 0;

    const posts = await this.postRepository.searchPosts(query, parsedLimit, parsedOffset);

    const originalPostIds = posts
      .filter(p => p.postType !== PostType.REPOST)
      .map(p => p.id);
    const allPostIds = posts.map(p => p.id);

    const [repostStatusMap, bookmarkStatusMap] = await Promise.all([
      this.postRepository.getRepostStatusForPosts(userId, originalPostIds),
      this.postRepository.getBookmarkStatusForPosts(userId, allPostIds),
    ]);

    return {
      success: true,
      data: posts.map((post) => this.formatPostResponse(post, userId, repostStatusMap, bookmarkStatusMap)),
    };
  }

  private formatPostResponse(
    post: any,
    currentUserId: string | null,
    repostStatusMap?: Map<string, boolean>,
    bookmarkStatusMap?: Map<string, boolean>,
  ) {
    const isLiked = currentUserId ? (post.likes?.some((u: any) => u.id === currentUserId) || false) : false;

    // For reposts, check if user reposted the original post
    // For regular posts, check if user has reposted this post
    let isReposted = false;
    if (currentUserId) {
      if (post.postType === PostType.REPOST) {
        // This is user's own repost, so they have reposted the original
        isReposted = post.user?.id === currentUserId;
      } else if (repostStatusMap) {
        isReposted = repostStatusMap.get(post.id) || false;
      }
    }

    const isBookmarked = currentUserId ? (bookmarkStatusMap?.get(post.id) || false) : false;

    const response: any = {
      id: post.id,
      content: post.content,
      imageUrls: post.imageUrls,
      videoUrl: post.videoUrl,
      postType: post.postType,
      likesCount: post.likesCount,
      commentsCount: post.commentsCount || 0,
      sharesCount: post.sharesCount || 0,
      isLiked,
      isReposted,
      isBookmarked,
      location: post.location,
      locationLat: post.locationLat ? parseFloat(post.locationLat) : null,
      locationLng: post.locationLng ? parseFloat(post.locationLng) : null,
      user: post.user ? {
        id: post.user.id,
        fullName: post.user.fullName,
        username: post.user.username,
        profilePicture: post.user.profilePicture,
      } : null,
      createdAt: post.createdAt,
      updatedAt: post.updatedAt,
    };

    // Include original post data for reposts
    if (post.postType === PostType.REPOST && post.originalPost) {
      response.originalPost = {
        id: post.originalPost.id,
        content: post.originalPost.content,
        imageUrls: post.originalPost.imageUrls,
        videoUrl: post.originalPost.videoUrl,
        postType: post.originalPost.postType,
        likesCount: post.originalPost.likesCount,
        commentsCount: post.originalPost.commentsCount || 0,
        sharesCount: post.originalPost.sharesCount || 0,
        isReposted: true, // If viewing a repost, user has reposted the original
        location: post.originalPost.location,
        user: post.originalPost.user ? {
          id: post.originalPost.user.id,
          fullName: post.originalPost.user.fullName,
          username: post.originalPost.user.username,
          profilePicture: post.originalPost.user.profilePicture,
        } : null,
        createdAt: post.originalPost.createdAt,
      };
    }

    return response;
  }

  // Bookmark methods
  async toggleBookmark(userId: string, postId: string) {
    const post = await this.postRepository.findById(postId);
    if (!post) {
      throw new NotFoundException('Post not found');
    }

    const { isBookmarked } = await this.postRepository.toggleBookmark(userId, postId);

    return {
      success: true,
      message: isBookmarked ? 'Post saved' : 'Post unsaved',
      data: { postId, isBookmarked },
    };
  }

  async getBookmarkedPosts(userId: string, limit?: number | string, offset?: number | string) {
    const parsedLimit = limit ? parseInt(String(limit), 10) : 50;
    const parsedOffset = offset ? parseInt(String(offset), 10) : 0;

    const posts = await this.postRepository.getBookmarkedPosts(userId, parsedLimit, parsedOffset);

    // Get repost status for all original posts
    const originalPostIds = posts
      .filter(p => p.postType !== PostType.REPOST)
      .map(p => p.id);
    const repostStatusMap = await this.postRepository.getRepostStatusForPosts(userId, originalPostIds);

    // All bookmarked posts are bookmarked
    const bookmarkStatusMap = new Map<string, boolean>();
    posts.forEach(p => bookmarkStatusMap.set(p.id, true));

    return {
      success: true,
      data: posts.map((post) => ({
        ...this.formatPostResponse(post, userId, repostStatusMap),
        isBookmarked: true,
      })),
    };
  }

  async advancedSearchPosts(userId: string, dto: AdvancedSearchDto) {
    const posts = await this.postRepository.advancedSearchPosts(dto);

    const originalPostIds = posts
      .filter(p => p.postType !== PostType.REPOST)
      .map(p => p.id);
    const allPostIds = posts.map(p => p.id);

    const [repostStatusMap, bookmarkStatusMap] = await Promise.all([
      this.postRepository.getRepostStatusForPosts(userId, originalPostIds),
      this.postRepository.getBookmarkStatusForPosts(userId, allPostIds),
    ]);

    return {
      success: true,
      data: posts.map((post) => this.formatPostResponse(post, userId, repostStatusMap, bookmarkStatusMap)),
    };
  }

  async getSearchSuggestions(query: string) {
    if (!query || query.length < 2) {
      return {
        success: true,
        data: { hashtags: [], users: [] },
      };
    }

    const suggestions = await this.postRepository.getSearchSuggestions(query);
    return {
      success: true,
      data: suggestions,
    };
  }
}
