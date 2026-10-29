import type { NotificationBroadcast, NotificationItem, NotificationType } from '@formula/shared';
import { Injectable } from '@nestjs/common';

import { DatabaseService } from '../database/database.service.js';

interface NotificationRow {
  id: string;
  user_id: string;
  type: NotificationType;
  title: string;
  body: string;
  link: string | null;
  data: Record<string, unknown>;
  read_at: Date | null;
  created_at: Date;
}

interface BroadcastRow {
  id: string;
  title: string;
  body: string;
  link: string | null;
  recipients_count: number;
  created_at: Date;
  sender_id: string | null;
  sender_name: string | null;
}

export interface NotificationInsert {
  type: NotificationType;
  title: string;
  body: string;
  link: string | null;
  data: Record<string, unknown>;
}

const SELECT =
  'SELECT id, user_id, type, title, body, link, data, read_at, created_at FROM notifications';

function toItem(row: NotificationRow): NotificationItem {
  return {
    id: row.id,
    type: row.type,
    title: row.title,
    body: row.body,
    link: row.link,
    data: row.data ?? {},
    readAt: row.read_at?.toISOString() ?? null,
    createdAt: row.created_at.toISOString(),
  };
}

function toBroadcast(row: BroadcastRow): NotificationBroadcast {
  return {
    id: row.id,
    title: row.title,
    body: row.body,
    link: row.link,
    recipients: Number(row.recipients_count),
    sentAt: row.created_at.toISOString(),
    sentBy: row.sender_id ? { id: row.sender_id, name: row.sender_name ?? '' } : null,
  };
}

@Injectable()
export class NotificationsRepository {
  constructor(private readonly database: DatabaseService) {}

  async insert(userId: string, input: NotificationInsert): Promise<NotificationItem> {
    const row = await this.database.queryOne<NotificationRow>(
      `INSERT INTO notifications (user_id, type, title, body, link, data)
       VALUES ($1, $2, $3, $4, $5, $6::jsonb)
       RETURNING id, user_id, type, title, body, link, data, read_at, created_at`,
      [userId, input.type, input.title, input.body, input.link, JSON.stringify(input.data)],
    );
    return toItem(row as NotificationRow);
  }

  /** One row per student (everyone without an `admins` row). Returns how many were written. */
  async insertForStudents(input: NotificationInsert): Promise<number> {
    const rows = await this.database.query<{ id: string }>(
      `INSERT INTO notifications (user_id, type, title, body, link, data)
       SELECT u.id, $1, $2, $3, $4, $5::jsonb
       FROM users u
       WHERE NOT EXISTS (SELECT 1 FROM admins a WHERE a.user_id = u.id)
       RETURNING id`,
      [input.type, input.title, input.body, input.link, JSON.stringify(input.data)],
    );
    return rows.length;
  }

  /** The unread notification of this type whose `data[key]` equals `value`, if any (for coalescing). */
  async findUnreadByData(
    userId: string,
    type: NotificationType,
    key: string,
    value: string,
  ): Promise<NotificationItem | null> {
    const row = await this.database.queryOne<NotificationRow>(
      `${SELECT}
       WHERE user_id = $1 AND type = $2 AND read_at IS NULL AND data->>$3 = $4
       ORDER BY created_at DESC
       LIMIT 1`,
      [userId, type, key, value],
    );
    return row ? toItem(row) : null;
  }

  /** Refreshes an existing notification instead of adding another one (it moves to the top). */
  async bump(id: string, input: NotificationInsert): Promise<NotificationItem> {
    const row = await this.database.queryOne<NotificationRow>(
      `UPDATE notifications
       SET title = $2, body = $3, link = $4, data = $5::jsonb, created_at = now()
       WHERE id = $1
       RETURNING id, user_id, type, title, body, link, data, read_at, created_at`,
      [id, input.title, input.body, input.link, JSON.stringify(input.data)],
    );
    return toItem(row as NotificationRow);
  }

  async listByUser(
    userId: string,
    options: { page: number; limit: number; unreadOnly: boolean },
  ): Promise<{ items: NotificationItem[]; total: number }> {
    const rows = await this.database.query<NotificationRow & { total: string }>(
      `SELECT id, user_id, type, title, body, link, data, read_at, created_at, count(*) OVER() AS total
       FROM notifications
       WHERE user_id = $1 AND ($2::boolean = false OR read_at IS NULL)
       ORDER BY created_at DESC, id DESC
       LIMIT $3 OFFSET $4`,
      [userId, options.unreadOnly, options.limit, (options.page - 1) * options.limit],
    );
    return { items: rows.map(toItem), total: Number(rows[0]?.total ?? 0) };
  }

  async countUnread(userId: string): Promise<number> {
    const row = await this.database.queryOne<{ total: string }>(
      'SELECT count(*)::text AS total FROM notifications WHERE user_id = $1 AND read_at IS NULL',
      [userId],
    );
    return Number(row?.total ?? 0);
  }

  async markRead(userId: string, id: string): Promise<NotificationItem | null> {
    const row = await this.database.queryOne<NotificationRow>(
      `UPDATE notifications SET read_at = COALESCE(read_at, now())
       WHERE id = $1 AND user_id = $2
       RETURNING id, user_id, type, title, body, link, data, read_at, created_at`,
      [id, userId],
    );
    return row ? toItem(row) : null;
  }

  async markAllRead(userId: string): Promise<void> {
    await this.database.query(
      'UPDATE notifications SET read_at = now() WHERE user_id = $1 AND read_at IS NULL',
      [userId],
    );
  }

  /** Marks read the unread notifications of a type, optionally only those about one thing. */
  async markReadByType(
    userId: string,
    type: NotificationType,
    filter?: { key: string; value: string },
  ): Promise<number> {
    const rows = await this.database.query<{ id: string }>(
      `UPDATE notifications SET read_at = now()
       WHERE user_id = $1 AND type = $2 AND read_at IS NULL
         AND ($3::text IS NULL OR data->>$3 = $4)
       RETURNING id`,
      [userId, type, filter?.key ?? null, filter?.value ?? null],
    );
    return rows.length;
  }

  // ---- Broadcasts (news) ----

  async insertBroadcast(input: {
    title: string;
    body: string;
    link: string | null;
    sentBy: string;
    recipients: number;
  }): Promise<NotificationBroadcast> {
    const row = await this.database.queryOne<{ id: string }>(
      `INSERT INTO notification_broadcasts (title, body, link, sent_by, recipients_count)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id`,
      [input.title, input.body, input.link, input.sentBy, input.recipients],
    );
    const broadcast = await this.findBroadcast((row as { id: string }).id);
    return broadcast as NotificationBroadcast;
  }

  async findBroadcast(id: string): Promise<NotificationBroadcast | null> {
    const row = await this.database.queryOne<BroadcastRow>(`${BROADCAST_SELECT} WHERE b.id = $1`, [
      id,
    ]);
    return row ? toBroadcast(row) : null;
  }

  async listBroadcasts(
    page: number,
    limit: number,
  ): Promise<{ items: NotificationBroadcast[]; total: number }> {
    const rows = await this.database.query<BroadcastRow & { total: string }>(
      `${BROADCAST_SELECT.replace('SELECT ', 'SELECT count(*) OVER() AS total, ')}
       ORDER BY b.created_at DESC
       LIMIT $1 OFFSET $2`,
      [limit, (page - 1) * limit],
    );
    return { items: rows.map(toBroadcast), total: Number(rows[0]?.total ?? 0) };
  }

  // ---- Queue sizes for the bell (read-only peeks into other modules' tables) ----

  async countPendingReviews(): Promise<number> {
    const row = await this.database.queryOne<{ total: string }>(
      `SELECT count(*)::text AS total FROM attempts WHERE status = 'pending_review'`,
    );
    return Number(row?.total ?? 0);
  }

  /** Unread messages written by one side, over all conversations (`student`) or in one student's own. */
  async countUnreadChatMessages(
    senderRole: 'student' | 'support',
    studentId?: string,
  ): Promise<number> {
    const row = await this.database.queryOne<{ total: string }>(
      `SELECT count(*)::text AS total
       FROM chat_messages m
       JOIN chat_conversations c ON c.id = m.conversation_id
       WHERE m.sender_role = $1 AND m.read_at IS NULL
         AND ($2::uuid IS NULL OR c.student_id = $2)`,
      [senderRole, studentId ?? null],
    );
    return Number(row?.total ?? 0);
  }

  async countPendingTestimonials(): Promise<number> {
    const row = await this.database.queryOne<{ total: string }>(
      `SELECT count(*)::text AS total FROM testimonials WHERE status = 'pending'`,
    );
    return Number(row?.total ?? 0);
  }

  /** Support conversations with at least one unread student message. */
  async countUnreadChats(): Promise<number> {
    const row = await this.database.queryOne<{ total: string }>(
      `SELECT count(DISTINCT conversation_id)::text AS total
       FROM chat_messages
       WHERE sender_role = 'student' AND read_at IS NULL`,
    );
    return Number(row?.total ?? 0);
  }
}

const BROADCAST_SELECT = `
  SELECT b.id, b.title, b.body, b.link, b.recipients_count, b.created_at,
         u.id AS sender_id, NULLIF(trim(concat_ws(' ', u.name, u.surname)), '') AS sender_name
  FROM notification_broadcasts b
  LEFT JOIN users u ON u.id = b.sent_by`;
