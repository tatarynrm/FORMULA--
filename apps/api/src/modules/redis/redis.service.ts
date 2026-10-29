import { Injectable, Logger, type OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Redis } from 'ioredis';

import type { Env } from '../../config/env.js';

/**
 * One Redis connection for the whole api. Redis is optional in development: when `REDIS_URL` is
 * missing or the server is down, `client` is `null` and the features built on it fall back to
 * PostgreSQL (slower, still correct). Nothing may throw because Redis is away.
 */
@Injectable()
export class RedisService implements OnModuleDestroy {
  private readonly logger = new Logger(RedisService.name);
  private readonly connection: Redis | null;
  private ready = false;

  constructor(config: ConfigService<Env, true>) {
    const url = config.get('REDIS_URL', { infer: true });
    if (!url) {
      this.connection = null;
      this.logger.warn('REDIS_URL is not set: online tracking runs on PostgreSQL only');
      return;
    }

    this.connection = new Redis(url, {
      lazyConnect: true,
      // A command must fail fast while Redis is away instead of queueing up forever.
      enableOfflineQueue: false,
      maxRetriesPerRequest: 1,
      retryStrategy: (attempt: number) => Math.min(attempt * 500, 10_000),
    });
    this.connection.on('ready', () => {
      this.ready = true;
      this.logger.log(`Redis: ${new URL(url).host}`);
    });
    this.connection.on('end', () => {
      this.ready = false;
    });
    this.connection.on('error', (error: Error) => {
      if (this.ready) this.logger.warn(`Redis error: ${error.message}`);
      this.ready = false;
    });
    this.connection.connect().catch((error: Error) => {
      this.logger.warn(`Redis is unavailable (${error.message}); falling back to PostgreSQL`);
    });
  }

  /** The connection when it is usable, otherwise `null` (callers then use their fallback). */
  get client(): Redis | null {
    return this.connection && this.ready ? this.connection : null;
  }

  /**
   * A second connection for Pub/Sub: a subscribed connection cannot run other commands. The caller
   * subscribes on every `ready` (ioredis reconnects by itself). `null` when Redis is not configured.
   */
  createSubscriber(): Redis | null {
    if (!this.connection) return null;
    const subscriber = this.connection.duplicate();
    subscriber.on('error', (error: Error) => {
      this.logger.warn(`Redis subscriber error: ${error.message}`);
    });
    subscriber.connect().catch(() => undefined);
    return subscriber;
  }

  async onModuleDestroy(): Promise<void> {
    await this.connection?.quit().catch(() => undefined);
  }
}
