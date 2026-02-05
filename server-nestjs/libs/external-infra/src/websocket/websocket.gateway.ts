import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayInit,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { WebSocketService } from './websocket.service';
import { RedisPresenceService } from '../redis/service/redis-presence.service';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
  namespace: '/ws',
})
export class WebSocketGatewayService
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer() server: Server;
  private readonly logger = new Logger(WebSocketGatewayService.name);

  constructor(
    private readonly webSocketService: WebSocketService,
    private readonly redisPresenceService: RedisPresenceService,
  ) {}

  afterInit(server: Server) {
    this.webSocketService.setServer(server);
    this.logger.log('WebSocket Gateway initialized');
  }

  handleConnection(client: Socket) {
    const userId = client.handshake.query.userId as string;
    if (userId) {
      this.webSocketService.addClient(userId, client);
      // Broadcast that user is online
      this.webSocketService.broadcastOnlineStatus(userId, true);
      // Record presence in Redis (distributed, survives restarts)
      this.redisPresenceService.heartbeat(userId).catch(() => {});
      this.logger.debug(`Client connected: ${client.id}, userId: ${userId}`);
    }
  }

  handleDisconnect(client: Socket) {
    const userId = client.handshake.query.userId as string;
    if (userId) {
      this.webSocketService.removeClient(userId);
      // Broadcast that user is offline
      this.webSocketService.broadcastOnlineStatus(userId, false);
      // Mark offline in Redis
      this.redisPresenceService.goOffline(userId).catch(() => {});
      this.logger.debug(`Client disconnected: ${client.id}, userId: ${userId}`);
    }
  }

  @SubscribeMessage('heartbeat')
  handleHeartbeat(@ConnectedSocket() client: Socket) {
    const userId = client.handshake.query.userId as string;
    if (userId) {
      this.redisPresenceService.heartbeat(userId).catch(() => {});
    }
    return { event: 'heartbeat_ack' };
  }

  @SubscribeMessage('join')
  handleJoin(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { userId: string },
  ) {
    this.webSocketService.addClient(data.userId, client);
    client.join(`user:${data.userId}`);
    return { event: 'joined', data: { userId: data.userId } };
  }

  @SubscribeMessage('leave')
  handleLeave(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { userId: string },
  ) {
    this.webSocketService.removeClient(data.userId);
    client.leave(`user:${data.userId}`);
    return { event: 'left', data: { userId: data.userId } };
  }

  // WebRTC Signaling
  @SubscribeMessage('callOffer')
  handleCallOffer(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { toUserId: string; offer: RTCSessionDescriptionInit; callType: 'audio' | 'video'; fromUser: any },
  ) {
    this.webSocketService.sendToUser(data.toUserId, 'callOffer' as any, {
      fromUserId: client.handshake.query.userId,
      fromUser: data.fromUser,
      offer: data.offer,
      callType: data.callType,
    });
    this.logger.debug(`Call offer sent from ${client.handshake.query.userId} to ${data.toUserId}`);
  }

  @SubscribeMessage('callAnswer')
  handleCallAnswer(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { toUserId: string; answer: RTCSessionDescriptionInit },
  ) {
    this.webSocketService.sendToUser(data.toUserId, 'callAnswer' as any, {
      fromUserId: client.handshake.query.userId,
      answer: data.answer,
    });
    this.logger.debug(`Call answer sent from ${client.handshake.query.userId} to ${data.toUserId}`);
  }

  @SubscribeMessage('iceCandidate')
  handleIceCandidate(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { toUserId: string; candidate: RTCIceCandidateInit },
  ) {
    this.webSocketService.sendToUser(data.toUserId, 'iceCandidate' as any, {
      fromUserId: client.handshake.query.userId,
      candidate: data.candidate,
    });
  }

  @SubscribeMessage('callEnd')
  handleCallEnd(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { toUserId: string },
  ) {
    this.webSocketService.sendToUser(data.toUserId, 'callEnd' as any, {
      fromUserId: client.handshake.query.userId,
    });
    this.logger.debug(`Call ended by ${client.handshake.query.userId}`);
  }

  @SubscribeMessage('callRejected')
  handleCallRejected(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { toUserId: string },
  ) {
    this.webSocketService.sendToUser(data.toUserId, 'callRejected' as any, {
      fromUserId: client.handshake.query.userId,
    });
    this.logger.debug(`Call rejected by ${client.handshake.query.userId}`);
  }

  // Typing Indicators
  @SubscribeMessage('typing')
  handleTyping(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { toUserId: string },
  ) {
    const fromUserId = client.handshake.query.userId as string;
    this.webSocketService.sendToUser(data.toUserId, 'typing' as any, {
      fromUserId,
    });
  }

  @SubscribeMessage('stopTyping')
  handleStopTyping(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { toUserId: string },
  ) {
    const fromUserId = client.handshake.query.userId as string;
    this.webSocketService.sendToUser(data.toUserId, 'stopTyping' as any, {
      fromUserId,
    });
  }
}
