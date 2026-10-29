import { randomUUID } from 'node:crypto';

import { REALTIME, type RealtimeEvent } from '@formula/shared';
import { Injectable, Logger, type OnModuleDestroy, type OnModuleInit } from '@nestjs/common';
import type { Response } from 'express';
import type { Redis } from 'ioredis';

import { RedisService } from '../redis/redis.service.js';

/** One open `GET /events` response. */
interface Client {
  id: string;
  userId: string;
  channels: Set<string>;
  response: Response;
}

/** Where an event goes: one user (all their tabs) or everyone subscribed to a channel. */
export interface RealtimeTarget {
  kind: 'user' | 'channel';
  id: string;
}

/** What travels through Redis between api instances. */
interface Envelope {
  origin: string;
  target: RealtimeTarget;
  event: RealtimeEvent;
}

const REDIS_CHANNEL = 'realtime:events';

/**
 * Server-Sent Events hub. Each tab of a signed-in user keeps one stream open; services push
 * `RealtimeEvent`s to a user or to a channel (`students`, `admins`, `support`, `reviews`). With Redis
 * the events are also published to the other api instances, so it does not matter which one holds
 * the connection; without Redis everything still works on a single instance.
 */
@Injectable()
export class RealtimeService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RealtimeService.name);
  private readonly instanceId = randomUUID();
  private readonly clients = new Map<string, Client>();
  private readonly byUser = new Map<string, Set<Client>>();
  private readonly byChannel = new Map<string, Set<Client>>();
  private subscriber: Redis | null = null;
  private keepalive: ReturnType<typeof setInterval> | null = null;

  constructor(private readonly redis: RedisService) {}

  onModuleInit(): void {
    // A comment line keeps proxies and browsers from closing an idle stream.
    this.keepalive = setInterval(() => {
      for (const client of this.clients.values()) this.write(client, ': ping\n\n');
    }, REALTIME.KEEPALIVE_MS);

    this.subscriber = this.redis.createSubscriber();
    if (!this.subscriber) return;
    this.subscriber.on('ready', () => {
      this.subscriber?.subscribe(REDIS_CHANNEL).catch((error: Error) => {
        this.logger.warn(`Could not subscribe to realtime events: ${error.message}`);
      });
    });
    this.subscriber.on('message', (_channel: string, raw: string) => {
      try {
        const envelope = JSON.parse(raw) as Envelope;
        // Own events were already delivered locally.
        if (envelope.origin !== this.instanceId) this.deliver(envelope.target, envelope.event);
      } catch {
        this.logger.warn('Dropped a malformed realtime envelope');
      }
    });
  }

  async onModuleDestroy(): Promise<void> {
    if (this.keepalive) clearInterval(this.keepalive);
    for (const client of this.clients.values()) client.response.end();
    this.clients.clear();
    await this.subscriber?.quit().catch(() => undefined);
  }

  /** Turns the response into an event stream and keeps it until the client goes away. */
  connect(userId: string, channels: string[], response: Response): void {
    const client: Client = { id: randomUUID(), userId, channels: new Set(channels), response };

    response.status(200);
    response.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
    response.setHeader('Cache-Control', 'no-cache, no-transform');
    response.setHeader('Connection', 'keep-alive');
    // Tells nginx not to buffer this response.
    response.setHeader('X-Accel-Buffering', 'no');
    response.flushHeaders();
    response.write(`retry: ${REALTIME.RETRY_MS}\n: connected\n\n`);

    this.clients.set(client.id, client);
    this.index(this.byUser, userId, client);
    for (const channel of client.channels) this.index(this.byChannel, channel, client);

    response.on('close', () => this.remove(client));
  }

  /** Sends an event to every open tab of one user (on every api instance). */
  publishToUser(userId: string, event: RealtimeEvent): void {
    this.publish({ kind: 'user', id: userId }, event);
  }

  /** Sends an event to everyone subscribed to a channel (on every api instance). */
  publishToChannel(channel: string, event: RealtimeEvent): void {
    this.publish({ kind: 'channel', id: channel }, event);
  }

  /** How many streams are open on this instance (for health and tests). */
  get connectionCount(): number {
    return this.clients.size;
  }

  private publish(target: RealtimeTarget, event: RealtimeEvent): void {
    this.deliver(target, event);
    const client = this.redis.client;
    if (!client) return;
    const envelope: Envelope = { origin: this.instanceId, target, event };
    client.publish(REDIS_CHANNEL, JSON.stringify(envelope)).catch((error: Error) => {
      this.logger.warn(`Could not publish a realtime event: ${error.message}`);
    });
  }

  private deliver(target: RealtimeTarget, event: RealtimeEvent): void {
    const recipients =
      target.kind === 'user' ? this.byUser.get(target.id) : this.byChannel.get(target.id);
    if (!recipients || recipients.size === 0) return;
    const payload = `data: ${JSON.stringify(event)}\n\n`;
    for (const client of recipients) this.write(client, payload);
  }

  private write(client: Client, chunk: string): void {
    try {
      client.response.write(chunk);
    } catch {
      this.remove(client);
    }
  }

  private index(map: Map<string, Set<Client>>, key: string, client: Client): void {
    let set = map.get(key);
    if (!set) {
      set = new Set();
      map.set(key, set);
    }
    set.add(client);
  }

  private unindex(map: Map<string, Set<Client>>, key: string, client: Client): void {
    const set = map.get(key);
    if (!set) return;
    set.delete(client);
    if (set.size === 0) map.delete(key);
  }

  private remove(client: Client): void {
    if (!this.clients.delete(client.id)) return;
    this.unindex(this.byUser, client.userId, client);
    for (const channel of client.channels) this.unindex(this.byChannel, channel, client);
  }
}
