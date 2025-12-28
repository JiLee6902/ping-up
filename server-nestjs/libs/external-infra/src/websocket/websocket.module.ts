import { Module, Global } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '@app/entity';
import { WebSocketGatewayService } from './websocket.gateway';
import { WebSocketService } from './websocket.service';

@Global()
@Module({
  imports: [TypeOrmModule.forFeature([User])],
  providers: [WebSocketGatewayService, WebSocketService],
  exports: [WebSocketService],
})
export class WebSocketModule {}
