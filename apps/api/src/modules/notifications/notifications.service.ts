import type {
  NotificationBroadcast,
  NotificationItem,
  NotificationSummary,
  NotificationType,
} from '@formula/shared';
import { Inject, Injectable, Logger, NotFoundException } from '@nestjs/common';

import { PaginatedResult } from '../../common/paginated-result.js';
import { AccessService } from '../access/access.service.js';
import { RealtimeService } from '../realtime/realtime.service.js';
import type { SendBroadcastDto } from './dto/notifications.dto.js';
import { NOTIFICATION_CHANNELS, type NotificationChannel } from './notification-channels.js';
import { NotificationsRepository } from './notifications.repository.js';

export interface NotifyInput {
  type: NotificationType;
  title: string;
  body?: string;
  /** Path inside the site. */
  link?: string | null;
  data?: Record<string, unknown>;
  /**
   * Name of a `data` field: while an unread notification of the same type with the same value
   * exists, it is refreshed instead of adding another (one bell entry per chat, not per message).
   */
  coalesceBy?: string;
}

/**
 * Writes notifications and hands them to every channel (the bell today, Telegram and email later).
 * Writing never throws: a failed notification must not break the action that caused it.
 */
@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(
    private readonly repository: NotificationsRepository,
    private readonly access: AccessService,
    private readonly realtime: RealtimeService,
    @Inject(NOTIFICATION_CHANNELS) private readonly channels: NotificationChannel[],
  ) {}

  async notify(userId: string, input: NotifyInput): Promise<NotificationItem | null> {
    try {
      const data = input.data ?? {};
      const insert = {
        type: input.type,
        title: input.title,
        body: input.body ?? '',
        link: input.link ?? null,
        data,
      };

      const coalesceValue = input.coalesceBy ? data[input.coalesceBy] : undefined;
      const existing =
        input.coalesceBy && typeof coalesceValue === 'string'
          ? await this.repository.findUnreadByData(
              userId,
              input.type,
              input.coalesceBy,
              coalesceValue,
            )
          : null;
      const notification = existing
        ? await this.repository.bump(existing.id, insert)
        : await this.repository.insert(userId, insert);

      for (const channel of this.channels) {
        await channel.deliver(userId, notification).catch((error: Error) => {
          this.logger.warn(`Channel ${channel.name} failed: ${error.message}`);
        });
      }
      return notification;
    } catch (error) {
      this.logger.warn(`Could not notify ${userId}: ${(error as Error).message}`);
      return null;
    }
  }

  /** Notifies every admin who may use a section (the reviews team, the support team). */
  async notifySection(sectionKey: string, input: NotifyInput): Promise<void> {
    try {
      const userIds = await this.access.listUserIdsWithSection(sectionKey);
      for (const userId of userIds) await this.notify(userId, input);
    } catch (error) {
      this.logger.warn(`Could not notify section ${sectionKey}: ${(error as Error).message}`);
    }
  }

  // ---- Reading ----

  async list(
    userId: string,
    query: { page: number; limit: number; unread?: boolean },
  ): Promise<PaginatedResult<NotificationItem>> {
    const { items, total } = await this.repository.listByUser(userId, {
      page: query.page,
      limit: query.limit,
      unreadOnly: query.unread === true,
    });
    return new PaginatedResult(items, total, query.page, query.limit);
  }

  async summary(userId: string): Promise<NotificationSummary> {
    const context = await this.access.getContext(userId);
    const isSupport = this.access.canUseSection(context, 'support');
    const [unread, pendingReviews, unreadChats, chatUnread, pendingTestimonials] =
      await Promise.all([
        this.repository.countUnread(userId),
        this.access.canUseSection(context, 'reviews')
          ? this.repository.countPendingReviews()
          : null,
        isSupport ? this.repository.countUnreadChats() : null,
        // The menu badge: the team sees what students wrote, a student sees what the team answered.
        isSupport
          ? this.repository.countUnreadChatMessages('student')
          : context?.role === 'student'
            ? this.repository.countUnreadChatMessages('support', userId)
            : null,
        this.access.canUseSection(context, 'testimonials')
          ? this.repository.countPendingTestimonials()
          : null,
      ]);
    return { unread, pendingReviews, unreadChats, chatUnread, pendingTestimonials };
  }

  async markRead(userId: string, id: string): Promise<NotificationItem> {
    const notification = await this.repository.markRead(userId, id);
    if (!notification) throw new NotFoundException('Notification not found');
    await this.publishUnread(userId);
    return notification;
  }

  async markAllRead(userId: string): Promise<{ unread: number }> {
    await this.repository.markAllRead(userId);
    this.realtime.publishToUser(userId, { type: 'notifications.read', unread: 0 });
    return { unread: 0 };
  }

  /** Called when the user saw the thing itself (opened the chat): its bell entries are read too. */
  async markReadByType(
    userId: string,
    type: NotificationType,
    filter?: { key: string; value: string },
  ): Promise<void> {
    try {
      if ((await this.repository.markReadByType(userId, type, filter)) > 0) {
        await this.publishUnread(userId);
      }
    } catch (error) {
      this.logger.warn(`Could not mark ${type} read for ${userId}: ${(error as Error).message}`);
    }
  }

  // ---- News (admin broadcast) ----

  async broadcast(senderId: string, dto: SendBroadcastDto): Promise<NotificationBroadcast> {
    const insert = {
      type: 'news' as const,
      title: dto.title,
      body: dto.body,
      link: dto.link ?? null,
      data: {},
    };
    const recipients = await this.repository.insertForStudents(insert);
    const broadcast = await this.repository.insertBroadcast({
      title: dto.title,
      body: dto.body,
      link: dto.link ?? null,
      sentBy: senderId,
      recipients,
    });
    // Every open student tab reloads its bell; other channels will pick the rows up later.
    this.realtime.publishToChannel('students', { type: 'notifications.refresh' });
    return broadcast;
  }

  async listBroadcasts(
    page: number,
    limit: number,
  ): Promise<PaginatedResult<NotificationBroadcast>> {
    const { items, total } = await this.repository.listBroadcasts(page, limit);
    return new PaginatedResult(items, total, page, limit);
  }

  private async publishUnread(userId: string): Promise<void> {
    const unread = await this.repository.countUnread(userId);
    this.realtime.publishToUser(userId, { type: 'notifications.read', unread });
  }
}
