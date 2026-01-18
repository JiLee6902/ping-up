import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Message, User, ChatSettings, ChatEvent, Connection } from '@app/entity';
import { WebSocketModule } from '@app/external-infra/websocket';
import { MessageController } from './controller/message.controller';
import { MessageService } from './service/message.service';
import { MessageRepository } from './repository/message.repository';

@Module({
  imports: [
    TypeOrmModule.forFeature([Message, User, ChatSettings, ChatEvent, Connection]),
    WebSocketModule,
  ],
  controllers: [MessageController],
  providers: [MessageService, MessageRepository],
  exports: [MessageService, MessageRepository],
})
export class MessageModule {}
