import { Injectable, Logger, Optional } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { InjectMetric } from '@willsoto/nestjs-prometheus';
import { Counter, Gauge } from 'prom-client';
import { Repository } from 'typeorm';
import { Server, Socket } from 'socket.io';
import { User } from '@app/entity';
import { SocketEventDto, SocketEvent } from './dto/socket-events.dto';

@Injectable()
export class WebSocketService {
  private readonly logger = new Logger(WebSocketService.name);
  private server: Server;
  private clients: Map<string, Socket> = new Map();

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @Optional()
    @InjectMetric('websocket_connections_active')
    private readonly connectionsGauge?: Gauge<string>,
    @Optional()
    @InjectMetric('websocket_events_total')
    private readonly eventsCounter?: Counter<string>,
  ) {}

  setServer(server: Server) {
    this.server = server;
  }

  addClient(userId: string, client: Socket) {
    this.clients.set(userId, client);
    this.connectionsGauge?.set(this.clients.size);
    // Update lastActivityAt when user connects
    this.updateLastActivity(userId);
  }

  removeClient(userId: string) {
    this.clients.delete(userId);
    this.connectionsGauge?.set(this.clients.size);
    // Update lastActivityAt when user disconnects
    this.updateLastActivity(userId);
  }

  async updateLastActivity(userId: string) {
    try {
      await this.userRepository.update(userId, { lastActivityAt: new Date() });
    } catch (error) {
      this.logger.error(`Failed to update lastActivityAt for user ${userId}`, error);
    }
  }

  getClient(userId: string): Socket | undefined {
    return this.clients.get(userId);
  }

  isOnline(userId: string): boolean {
    return this.clients.has(userId);
  }

  sendToUser(userId: string, event: SocketEvent, data: unknown) {
    this.eventsCounter?.inc({ event });
    const client = this.clients.get(userId);
    if (client) {
      client.emit(event, data);
      this.logger.debug(`Event ${event} sent to user ${userId}`);
    } else {
      this.server?.to(`user:${userId}`).emit(event, data);
    }
  }

  sendNewMessage(toUserId: string, message: SocketEventDto['newMessage']) {
    this.sendToUser(toUserId, SocketEvent.NEW_MESSAGE, message);
  }

  sendConnectionRequest(toUserId: string, data: SocketEventDto['connectionRequest']) {
    this.sendToUser(toUserId, SocketEvent.CONNECTION_REQUEST, data);
  }

  sendConnectionAccepted(toUserId: string, data: SocketEventDto['connectionAccepted']) {
    this.sendToUser(toUserId, SocketEvent.CONNECTION_ACCEPTED, data);
  }

  sendNewFollower(toUserId: string, data: SocketEventDto['newFollower']) {
    this.sendToUser(toUserId, SocketEvent.NEW_FOLLOWER, data);
  }

  broadcast(event: SocketEvent, data: unknown) {
    this.server?.emit(event, data);
  }

  getOnlineUsers(): string[] {
    return Array.from(this.clients.keys());
  }

  broadcastOnlineStatus(userId: string, isOnline: boolean) {
    const event = isOnline ? SocketEvent.USER_ONLINE : SocketEvent.USER_OFFLINE;
    this.server?.emit(event, { userId });
    this.logger.debug(`User ${userId} is now ${isOnline ? 'online' : 'offline'}`);
  }

  getOnlineStatusForUsers(userIds: string[]): Record<string, boolean> {
    const result: Record<string, boolean> = {};
    for (const userId of userIds) {
      result[userId] = this.clients.has(userId);
    }
    return result;
  }

  // Post update events
  sendPostLiked(toUserId: string, data: SocketEventDto['postLiked']) {
    this.sendToUser(toUserId, SocketEvent.POST_LIKED, data);
  }

  sendPostCommented(toUserId: string, data: SocketEventDto['postCommented']) {
    this.sendToUser(toUserId, SocketEvent.POST_COMMENTED, data);
  }

  sendCommentLiked(toUserId: string, data: SocketEventDto['commentLiked']) {
    this.sendToUser(toUserId, SocketEvent.COMMENT_LIKED, data);
  }

  sendNotification(toUserId: string, data: SocketEventDto['notification']) {
    this.sendToUser(toUserId, SocketEvent.NOTIFICATION, data);
  }
}
