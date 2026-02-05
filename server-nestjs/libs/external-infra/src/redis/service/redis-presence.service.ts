import { Injectable, OnModuleInit } from '@nestjs/common';
import { RedisService } from './redis.service';

export interface UserPresence {
  userId: string;
  isOnline: boolean;
  lastSeen: number; // Unix timestamp in seconds
}

@Injectable()
export class RedisPresenceService implements OnModuleInit {
  private heartbeatScriptSha: string = '';
  private goOfflineScriptSha: string = '';
  private getOnlineFriendsScriptSha: string = '';

  // Lua script: Heartbeat / Go Online
  // Atomically: mark user online, set TTL, update last_seen, add to online set
  // KEYS[1] = user presence hash key ("presence:<userId>")
  // KEYS[2] = online users set key ("presence:online")
  // ARGV[1] = userId
  // ARGV[2] = current timestamp in seconds
  // ARGV[3] = TTL in seconds (heartbeat interval * 2, e.g., 90s)
  //
  // Returns: 1 (newly online) or 0 (already online, refreshed)
  private readonly HEARTBEAT_SCRIPT = `
    local presenceKey = KEYS[1]
    local onlineSetKey = KEYS[2]
    local userId = ARGV[1]
    local nowSec = tonumber(ARGV[2])
    local ttlSec = tonumber(ARGV[3])

    -- Check if user was already online
    local wasOnline = redis.call('EXISTS', presenceKey)

    -- Set presence data atomically
    redis.call('HSET', presenceKey, 'status', 'online', 'lastSeen', nowSec, 'userId', userId)

    -- Set TTL on the presence key (auto-expire = auto-offline)
    redis.call('EXPIRE', presenceKey, ttlSec)

    -- Add to the online users set
    redis.call('SADD', onlineSetKey, userId)

    -- Return whether this is a new connection
    if wasOnline == 0 then
      return 1
    end
    return 0
  `;

  // Lua script: Go Offline
  // Atomically: set status to offline, update last_seen, remove from online set
  // KEYS[1] = user presence hash key
  // KEYS[2] = online users set key
  // ARGV[1] = userId
  // ARGV[2] = current timestamp in seconds
  //
  // Returns: 1 (was online, now offline) or 0 (was already offline)
  private readonly GO_OFFLINE_SCRIPT = `
    local presenceKey = KEYS[1]
    local onlineSetKey = KEYS[2]
    local userId = ARGV[1]
    local nowSec = tonumber(ARGV[2])

    -- Remove from online set
    local removed = redis.call('SREM', onlineSetKey, userId)

    -- Update last_seen and set status to offline
    redis.call('HSET', presenceKey, 'status', 'offline', 'lastSeen', nowSec)

    -- Remove short TTL, set a longer TTL (30 days) to keep last_seen data
    redis.call('PERSIST', presenceKey)
    redis.call('EXPIRE', presenceKey, 2592000)

    return removed
  `;

  // Lua script: Get online status for a list of friends
  // KEYS[1] = online users set key
  // ARGV = list of user IDs to check
  //
  // Returns: array of 0/1 for each userId
  private readonly GET_ONLINE_FRIENDS_SCRIPT = `
    local onlineSetKey = KEYS[1]
    local results = {}

    for i = 1, #ARGV do
      local isOnline = redis.call('SISMEMBER', onlineSetKey, ARGV[i])
      results[i] = isOnline
    end

    return results
  `;

  private readonly ONLINE_SET_KEY = 'presence:online';
  private readonly HEARTBEAT_TTL = 90; // seconds (expect heartbeat every ~45s)

  constructor(private readonly redisService: RedisService) {}

  async onModuleInit(): Promise<void> {
    try {
      this.heartbeatScriptSha = await this.redisService.scriptLoad(
        this.HEARTBEAT_SCRIPT,
      );
      this.goOfflineScriptSha = await this.redisService.scriptLoad(
        this.GO_OFFLINE_SCRIPT,
      );
      this.getOnlineFriendsScriptSha = await this.redisService.scriptLoad(
        this.GET_ONLINE_FRIENDS_SCRIPT,
      );
    } catch {
      console.warn('Failed to preload presence Lua scripts, will use eval');
    }
  }

  private getPresenceKey(userId: string): string {
    return `presence:${userId}`;
  }

  /**
   * Record a heartbeat for a user (called on WS connect and periodic ping).
   * Returns true if the user is newly online (was offline before).
   */
  async heartbeat(userId: string): Promise<boolean> {
    const presenceKey = this.getPresenceKey(userId);
    const now = Math.floor(Date.now() / 1000);

    let result: number;

    try {
      if (this.heartbeatScriptSha) {
        result = await this.redisService.evalsha<number>(
          this.heartbeatScriptSha,
          [presenceKey, this.ONLINE_SET_KEY],
          [userId, now, this.HEARTBEAT_TTL],
        );
      } else {
        result = await this.redisService.eval<number>(
          this.HEARTBEAT_SCRIPT,
          [presenceKey, this.ONLINE_SET_KEY],
          [userId, now, this.HEARTBEAT_TTL],
        );
      }
    } catch {
      this.heartbeatScriptSha = await this.redisService.scriptLoad(
        this.HEARTBEAT_SCRIPT,
      );
      result = await this.redisService.evalsha<number>(
        this.heartbeatScriptSha,
        [presenceKey, this.ONLINE_SET_KEY],
        [userId, now, this.HEARTBEAT_TTL],
      );
    }

    return result === 1;
  }

  /**
   * Mark a user as offline (called on WS disconnect).
   * Returns true if the user was actually online.
   */
  async goOffline(userId: string): Promise<boolean> {
    const presenceKey = this.getPresenceKey(userId);
    const now = Math.floor(Date.now() / 1000);

    let result: number;

    try {
      if (this.goOfflineScriptSha) {
        result = await this.redisService.evalsha<number>(
          this.goOfflineScriptSha,
          [presenceKey, this.ONLINE_SET_KEY],
          [userId, now],
        );
      } else {
        result = await this.redisService.eval<number>(
          this.GO_OFFLINE_SCRIPT,
          [presenceKey, this.ONLINE_SET_KEY],
          [userId, now],
        );
      }
    } catch {
      this.goOfflineScriptSha = await this.redisService.scriptLoad(
        this.GO_OFFLINE_SCRIPT,
      );
      result = await this.redisService.evalsha<number>(
        this.goOfflineScriptSha,
        [presenceKey, this.ONLINE_SET_KEY],
        [userId, now],
      );
    }

    return result === 1;
  }

  /**
   * Check which of the given user IDs are currently online.
   * Uses Lua script for batch SISMEMBER checks.
   */
  async getOnlineFriends(userIds: string[]): Promise<Map<string, boolean>> {
    if (userIds.length === 0) return new Map();

    let results: number[];

    try {
      if (this.getOnlineFriendsScriptSha) {
        results = await this.redisService.evalsha<number[]>(
          this.getOnlineFriendsScriptSha,
          [this.ONLINE_SET_KEY],
          userIds,
        );
      } else {
        results = await this.redisService.eval<number[]>(
          this.GET_ONLINE_FRIENDS_SCRIPT,
          [this.ONLINE_SET_KEY],
          userIds,
        );
      }
    } catch {
      this.getOnlineFriendsScriptSha = await this.redisService.scriptLoad(
        this.GET_ONLINE_FRIENDS_SCRIPT,
      );
      results = await this.redisService.evalsha<number[]>(
        this.getOnlineFriendsScriptSha,
        [this.ONLINE_SET_KEY],
        userIds,
      );
    }

    const statusMap = new Map<string, boolean>();
    userIds.forEach((id, idx) => {
      statusMap.set(id, results[idx] === 1);
    });
    return statusMap;
  }

  /**
   * Get a single user's presence data (online status + last seen timestamp).
   */
  async getUserPresence(userId: string): Promise<UserPresence> {
    const presenceKey = this.getPresenceKey(userId);
    const client = this.redisService.getClient();
    const data = await client.hgetall(presenceKey);

    if (!data || !data.status) {
      return { userId, isOnline: false, lastSeen: 0 };
    }

    return {
      userId,
      isOnline: data.status === 'online',
      lastSeen: parseInt(data.lastSeen || '0', 10),
    };
  }

  /**
   * Get count of currently online users.
   */
  async getOnlineCount(): Promise<number> {
    return this.redisService.scard(this.ONLINE_SET_KEY);
  }

  /**
   * Get all online user IDs.
   */
  async getAllOnlineUserIds(): Promise<string[]> {
    return this.redisService.smembers(this.ONLINE_SET_KEY);
  }
}
