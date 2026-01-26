import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Post, User, Connection, Bookmark, Reaction, Poll, PollVote } from '@app/entity';
import { PostController } from './controller/post.controller';
import { PostService } from './service/post.service';
import { PostRepository } from './repository/post.repository';
import { NotificationModule } from '../notification/notification.module';
import { UserModule } from '../user/user.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Post, User, Connection, Bookmark, Reaction, Poll, PollVote]),
    forwardRef(() => NotificationModule),
    forwardRef(() => UserModule),
  ],
  controllers: [PostController],
  providers: [PostService, PostRepository],
  exports: [PostService, PostRepository],
})
export class PostModule {}
