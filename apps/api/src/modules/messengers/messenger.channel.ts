import type { NotificationItem } from '@formula/shared';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import type { Env } from '../../config/env.js';
import type { NotificationChannel } from '../notifications/notification-channels.js';
import { MessengerRegistry } from './messenger-registry.service.js';
import { MessengersRepository } from './messengers.repository.js';
import { MessengersService } from './messengers.service.js';

/**
 * Sends a notification to the messengers the person connected (Telegram, later others). Only a
 * person who finished the connection (shared the phone) and keeps notifications on gets it.
 * Delivery happens in the background: a slow messenger must never slow the request that caused
 * the notification.
 */
@Injectable()
export class MessengerChannel implements NotificationChannel {
  readonly name = 'messengers';
  private readonly logger = new Logger(MessengerChannel.name);
  private readonly webUrl: string;

  constructor(
    private readonly registry: MessengerRegistry,
    private readonly repository: MessengersRepository,
    private readonly messengers: MessengersService,
    config: ConfigService<Env, true>,
  ) {
    const explicit = config.get('WEB_URL', { infer: true });
    this.webUrl = (explicit ?? config.get('CORS_ORIGINS', { infer: true })[0] ?? '').replace(
      /\/$/,
      '',
    );
  }

  deliver(userId: string, notification: NotificationItem): Promise<void> {
    void this.deliverEverywhere(userId, notification).catch((error: Error) => {
      this.logger.warn(`Messenger delivery failed: ${error.message}`);
    });
    return Promise.resolve();
  }

  private async deliverEverywhere(userId: string, notification: NotificationItem): Promise<void> {
    const url = notification.link ? `${this.webUrl}${notification.link}` : null;

    for (const provider of this.registry.all()) {
      if (!provider.configured) continue;
      const account = await this.repository.findDeliverable(userId, provider.name);
      if (!account) continue;

      const outcome = await provider.send(account, {
        title: notification.title,
        body: notification.body,
        url,
      });
      if (outcome === 'blocked') await this.messengers.markBlocked(account);
    }
  }
}
