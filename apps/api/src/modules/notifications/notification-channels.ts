import type { NotificationItem } from '@formula/shared';
import { Injectable } from '@nestjs/common';

import { RealtimeService } from '../realtime/realtime.service.js';
import { NotificationsRepository } from './notifications.repository.js';

/**
 * A way to hand a stored notification to the user. The in-site bell is the first one; Telegram
 * and email will be classes like this one (with their own user preferences), registered under
 * `NOTIFICATION_CHANNELS`. A channel must never throw: the notification is already saved.
 */
export interface NotificationChannel {
  readonly name: string;
  deliver(userId: string, notification: NotificationItem): Promise<void>;
}

export const NOTIFICATION_CHANNELS = Symbol('NOTIFICATION_CHANNELS');

/** The bell: pushes the notification (with the new unread total) to the user's open tabs. */
@Injectable()
export class InAppChannel implements NotificationChannel {
  readonly name = 'in_app';

  constructor(
    private readonly realtime: RealtimeService,
    private readonly repository: NotificationsRepository,
  ) {}

  async deliver(userId: string, notification: NotificationItem): Promise<void> {
    const unread = await this.repository.countUnread(userId);
    this.realtime.publishToUser(userId, { type: 'notification', notification, unread });
  }
}
