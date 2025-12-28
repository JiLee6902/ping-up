import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Comment, Post, User } from '@app/entity';
import { CommentController } from './controller/comment.controller';
import { CommentService } from './service/comment.service';
import { CommentRepository } from './repository/comment.repository';
import { NotificationModule } from '../notification/notification.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Comment, Post, User]),
    forwardRef(() => NotificationModule),
  ],
  controllers: [CommentController],
  providers: [CommentService, CommentRepository],
  exports: [CommentService, CommentRepository],
})
export class CommentModule {}
