import { PRESENCE, type StudentPresenceHistory, type UserPresence } from '@formula/shared';
import { Injectable, Logger } from '@nestjs/common';

import { RedisService } from '../redis/redis.service.js';
import { PresenceRepository } from './presence.repository.js';

/** Redis key with the time of the last request; it expires when the user stops being "online". */
const seenKey = (userId: string) => `presence:seen:${userId}`;
/** Sorted set of users seen lately (score = time), so the online ones can be listed. */
const ONLINE_SET = 'presence:online';
/** Redis key that exists while the last database write is recent enough. */
const writtenKey = (userId: string) => `presence:written:${userId}`;

/** Writes to PostgreSQL happen at most this often per user; Redis absorbs everything in between. */
const DB_WRITE_INTERVAL_SECONDS = 60;
const HISTORY_LIMIT = 60;

/**
 * Who is online. Every authenticated request calls `touch`: the live mark goes to Redis with a
 * short expiry (cheap, no disk), and once a minute the activity is also written to PostgreSQL,
 * which keeps the history the admin sees. Without Redis the same works on PostgreSQL alone,
 * with an in-memory throttle for the writes.
 */
@Injectable()
export class PresenceService {
  private readonly logger = new Logger(PresenceService.name);
  /** Fallback throttle when Redis is away: user id -> time of the last database write. */
  private readonly lastWrite = new Map<string, number>();
  /** Fallback when Redis is away: users who signed out since their last request. */
  private readonly signedOut = new Set<string>();

  constructor(
    private readonly redis: RedisService,
    private readonly repository: PresenceRepository,
  ) {}

  /** Marks the user as active now. Never throws: tracking must not break the request it rides on. */
  async touch(userId: string): Promise<void> {
    try {
      const client = this.redis.client;
      const now = Date.now();

      if (client) {
        const [, , written] = await Promise.all([
          client.set(seenKey(userId), String(now), 'EX', PRESENCE.ONLINE_WINDOW_SECONDS),
          client.zadd(ONLINE_SET, now, userId),
          // `NX` makes this an atomic "first one in a minute wins", also across api instances.
          client.set(writtenKey(userId), '1', 'EX', DB_WRITE_INTERVAL_SECONDS, 'NX'),
        ]);
        if (written === 'OK') await this.repository.markSeen(userId);
        return;
      }

      this.signedOut.delete(userId);
      const previous = this.lastWrite.get(userId) ?? 0;
      if (now - previous >= DB_WRITE_INTERVAL_SECONDS * 1000) {
        this.lastWrite.set(userId, now);
        await this.repository.markSeen(userId);
      }
    } catch (error) {
      this.logger.warn(`Could not record presence: ${(error as Error).message}`);
    }
  }

  /** The user signed out: they are offline at once, and the session closes at this moment. */
  async leave(userId: string): Promise<void> {
    try {
      await this.repository.markSeen(userId);
      const client = this.redis.client;
      if (client) {
        await client.del(seenKey(userId), writtenKey(userId));
        await client.zrem(ONLINE_SET, userId);
      }
      this.lastWrite.delete(userId);
      this.signedOut.add(userId);
    } catch (error) {
      this.logger.warn(`Could not record sign-out: ${(error as Error).message}`);
    }
  }

  /** Online flag and last request for several users at once (one Redis and one SQL round trip). */
  async getMany(userIds: string[]): Promise<Map<string, UserPresence>> {
    const result = new Map<string, UserPresence>();
    if (userIds.length === 0) return result;

    const stored = await this.repository.findLastSeen(userIds);
    const live = this.redis.client ? await this.readLive(userIds) : null;
    const threshold = Date.now() - PRESENCE.ONLINE_WINDOW_SECONDS * 1000;

    for (const userId of userIds) {
      const liveAt = live?.get(userId) ?? null;
      const storedAt = stored.get(userId)?.getTime() ?? null;
      const lastSeen = Math.max(liveAt ?? 0, storedAt ?? 0) || null;
      // With Redis the live mark decides: it expires by itself and sign-out removes it. Without
      // Redis the stored time decides, unless the user signed out since.
      const online = live
        ? liveAt !== null
        : storedAt !== null && storedAt > threshold && !this.signedOut.has(userId);
      result.set(userId, {
        online,
        lastSeenAt: lastSeen === null ? null : new Date(lastSeen).toISOString(),
      });
    }
    return result;
  }

  async getHistory(userId: string): Promise<StudentPresenceHistory> {
    const [presence, sessions, activeDaysLast30] = await Promise.all([
      this.getMany([userId]),
      this.repository.findSessions(userId, HISTORY_LIMIT),
      this.repository.countActiveDays(userId, 30),
    ]);
    const current = presence.get(userId) ?? { online: false, lastSeenAt: null };
    return { ...current, sessions, activeDaysLast30 };
  }

  /** Ids of everyone online right now, or `null` when Redis is away (then the caller uses the stored time). */
  async listOnlineIds(): Promise<string[] | null> {
    const client = this.redis.client;
    if (!client) return null;
    try {
      const oldest = Date.now() - PRESENCE.ONLINE_WINDOW_SECONDS * 1000;
      await client.zremrangebyscore(ONLINE_SET, '-inf', String(oldest));
      return await client.zrange(ONLINE_SET, '0', '-1');
    } catch (error) {
      this.logger.warn(`Could not list online users: ${(error as Error).message}`);
      return null;
    }
  }

  /** Times of the last request kept in Redis, for the users that have one. */
  private async readLive(userIds: string[]): Promise<Map<string, number>> {
    const client = this.redis.client;
    const result = new Map<string, number>();
    if (!client) return result;

    try {
      const values = await client.mget(userIds.map(seenKey));
      values.forEach((value: string | null, index: number) => {
        const at = Number(value);
        const userId = userIds[index];
        if (value && Number.isFinite(at) && userId) result.set(userId, at);
      });
    } catch (error) {
      this.logger.warn(`Could not read presence: ${(error as Error).message}`);
    }
    return result;
  }
}
