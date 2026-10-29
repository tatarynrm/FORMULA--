import type { ChatConversation, ChatMessage, ChatSenderRole, ChatStatus } from '@formula/shared';
import { Injectable } from '@nestjs/common';

import { DatabaseService } from '../database/database.service.js';

interface ConversationRow {
  id: string;
  status: ChatStatus;
  created_at: Date;
  updated_at: Date;
  student_id: string;
  name: string;
  surname: string;
  email: string;
  avatar_file_id: string | null;
  last_body: string | null;
  last_has_image: boolean | null;
  last_role: ChatSenderRole | null;
  last_at: Date | null;
  unread: string;
}

interface MessageRow {
  id: string;
  conversation_id: string;
  sender_id: string | null;
  sender_role: ChatSenderRole;
  sender_name: string | null;
  body: string;
  image_file_id: string | null;
  created_at: Date;
  read_at: Date | null;
}

/** Fallback name for a message of the team whose author's account is gone. */
const SUPPORT_NAME = 'Підтримка';

/**
 * `$1` = the role whose unread messages are counted ("the other side" of the viewer):
 * support sees unread student messages, the student sees unread support messages.
 */
const CONVERSATION_SELECT = `
  SELECT c.id, c.status, c.created_at, c.updated_at,
         u.id AS student_id, u.name, u.surname, u.email, p.avatar_file_id,
         lm.body AS last_body, (lm.image_file_id IS NOT NULL) AS last_has_image,
         lm.sender_role AS last_role, lm.created_at AS last_at,
         (SELECT count(*) FROM chat_messages m
           WHERE m.conversation_id = c.id AND m.read_at IS NULL AND m.sender_role = $1) AS unread
  FROM chat_conversations c
  JOIN users u ON u.id = c.student_id
  LEFT JOIN user_profiles p ON p.user_id = u.id
  LEFT JOIN LATERAL (
    SELECT body, image_file_id, sender_role, created_at
    FROM chat_messages m WHERE m.conversation_id = c.id
    ORDER BY created_at DESC LIMIT 1
  ) lm ON true`;

const MESSAGE_SELECT = `
  SELECT m.id, m.conversation_id, m.sender_id, m.sender_role, m.body, m.image_file_id,
         m.created_at, m.read_at,
         NULLIF(trim(concat_ws(' ', u.name, u.surname)), '') AS sender_name
  FROM chat_messages m
  LEFT JOIN users u ON u.id = m.sender_id`;

/** Which sender's messages count as unread for a viewer. */
export function otherSide(viewer: ChatSenderRole): ChatSenderRole {
  return viewer === 'student' ? 'support' : 'student';
}

function toConversation(row: ConversationRow): ChatConversation {
  return {
    id: row.id,
    status: row.status,
    student: {
      id: row.student_id,
      name: row.name,
      surname: row.surname,
      email: row.email,
      avatarFileId: row.avatar_file_id,
    },
    lastMessage:
      row.last_at && row.last_role
        ? {
            body: row.last_body ?? '',
            hasImage: row.last_has_image === true,
            senderRole: row.last_role,
            createdAt: row.last_at.toISOString(),
          }
        : null,
    unreadCount: Number(row.unread),
    createdAt: row.created_at.toISOString(),
    updatedAt: row.updated_at.toISOString(),
  };
}

function toMessage(row: MessageRow): ChatMessage {
  return {
    id: row.id,
    conversationId: row.conversation_id,
    senderId: row.sender_id,
    senderRole: row.sender_role,
    senderName: row.sender_name ?? (row.sender_role === 'support' ? SUPPORT_NAME : ''),
    body: row.body,
    imageFileId: row.image_file_id,
    createdAt: row.created_at.toISOString(),
    readAt: row.read_at?.toISOString() ?? null,
  };
}

@Injectable()
export class ChatRepository {
  constructor(private readonly database: DatabaseService) {}

  // ---- Conversations ----

  async findConversation(id: string, viewer: ChatSenderRole): Promise<ChatConversation | null> {
    const row = await this.database.queryOne<ConversationRow>(
      `${CONVERSATION_SELECT} WHERE c.id = $2`,
      [otherSide(viewer), id],
    );
    return row ? toConversation(row) : null;
  }

  async findConversationByStudent(studentId: string): Promise<ChatConversation | null> {
    const row = await this.database.queryOne<ConversationRow>(
      `${CONVERSATION_SELECT} WHERE c.student_id = $2`,
      ['support', studentId],
    );
    return row ? toConversation(row) : null;
  }

  /** The student's conversation, created on first use (safe under concurrent first calls). */
  async ensureConversation(studentId: string): Promise<ChatConversation> {
    await this.database.query(
      `INSERT INTO chat_conversations (student_id) VALUES ($1) ON CONFLICT (student_id) DO NOTHING`,
      [studentId],
    );
    const conversation = await this.findConversationByStudent(studentId);
    return conversation as ChatConversation;
  }

  async listConversations(options: {
    status?: ChatStatus;
    q?: string;
    page: number;
    limit: number;
  }): Promise<{ items: ChatConversation[]; total: number }> {
    const rows = await this.database.query<ConversationRow & { total: string }>(
      `${CONVERSATION_SELECT.replace('SELECT c.id,', 'SELECT count(*) OVER() AS total, c.id,')}
       WHERE ($2::text IS NULL OR c.status = $2)
         AND ($3::text IS NULL OR u.name ILIKE $4 OR u.surname ILIKE $4 OR u.email ILIKE $4
              OR concat_ws(' ', u.name, u.surname) ILIKE $4)
       ORDER BY c.last_message_at DESC NULLS LAST, c.created_at DESC
       LIMIT $5 OFFSET $6`,
      [
        'student',
        options.status ?? null,
        options.q ?? null,
        options.q ? `%${options.q}%` : null,
        options.limit,
        (options.page - 1) * options.limit,
      ],
    );
    return { items: rows.map(toConversation), total: Number(rows[0]?.total ?? 0) };
  }

  async setStatus(id: string, status: ChatStatus): Promise<boolean> {
    const rows = await this.database.query<{ id: string }>(
      'UPDATE chat_conversations SET status = $2 WHERE id = $1 RETURNING id',
      [id, status],
    );
    return rows.length > 0;
  }

  // ---- Messages ----

  /** Up to `limit` messages older than `before` (or the latest ones), oldest first; `hasMore` = older exist. */
  async listMessages(
    conversationId: string,
    options: { before?: string; limit: number },
  ): Promise<{ messages: ChatMessage[]; hasMore: boolean }> {
    const rows = await this.database.query<MessageRow>(
      `${MESSAGE_SELECT}
       WHERE m.conversation_id = $1
         AND ($2::uuid IS NULL OR (m.created_at, m.id) < (
           SELECT created_at, id FROM chat_messages WHERE id = $2 AND conversation_id = $1))
       ORDER BY m.created_at DESC, m.id DESC
       LIMIT $3`,
      [conversationId, options.before ?? null, options.limit + 1],
    );
    const hasMore = rows.length > options.limit;
    return { messages: rows.slice(0, options.limit).reverse().map(toMessage), hasMore };
  }

  async insertMessage(input: {
    conversationId: string;
    senderId: string;
    senderRole: ChatSenderRole;
    body: string;
    imageFileId: string | null;
  }): Promise<ChatMessage> {
    return this.database.transaction(async (tx) => {
      const inserted = await tx.queryOne<{ id: string }>(
        `INSERT INTO chat_messages (conversation_id, sender_id, sender_role, body, image_file_id)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING id`,
        [input.conversationId, input.senderId, input.senderRole, input.body, input.imageFileId],
      );
      // A student writing into a closed conversation reopens it.
      await tx.query(
        `UPDATE chat_conversations
         SET last_message_at = now(),
             status = CASE WHEN $2 = 'student' THEN 'open' ELSE status END
         WHERE id = $1`,
        [input.conversationId, input.senderRole],
      );
      const row = await tx.queryOne<MessageRow>(`${MESSAGE_SELECT} WHERE m.id = $1`, [
        (inserted as { id: string }).id,
      ]);
      return toMessage(row as MessageRow);
    });
  }

  /** Marks the other side's messages read. Returns the read time when anything changed. */
  async markRead(conversationId: string, reader: ChatSenderRole): Promise<Date | null> {
    const rows = await this.database.query<{ read_at: Date }>(
      `UPDATE chat_messages SET read_at = now()
       WHERE conversation_id = $1 AND read_at IS NULL AND sender_role = $2
       RETURNING read_at`,
      [conversationId, otherSide(reader)],
    );
    return rows[0]?.read_at ?? null;
  }

  async findUserName(userId: string): Promise<string | null> {
    const row = await this.database.queryOne<{ full_name: string | null }>(
      `SELECT NULLIF(trim(concat_ws(' ', name, surname)), '') AS full_name FROM users WHERE id = $1`,
      [userId],
    );
    return row?.full_name ?? null;
  }
}
