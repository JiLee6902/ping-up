import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GroupChat, GroupMember, GroupMessage, User } from '@app/entity';
import { WebSocketModule } from '@app/external-infra/websocket';
import { GroupChatController } from './controller/group-chat.controller';
import { GroupChatService } from './service/group-chat.service';
import { GroupChatRepository } from './repository/group-chat.repository';

@Module({
  imports: [
    TypeOrmModule.forFeature([GroupChat, GroupMember, GroupMessage, User]),
    WebSocketModule,
  ],
  controllers: [GroupChatController],
  providers: [GroupChatService, GroupChatRepository],
  exports: [GroupChatService, GroupChatRepository],
})
export class GroupChatModule {}
