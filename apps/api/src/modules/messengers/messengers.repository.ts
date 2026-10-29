import type { MessengerBot } from '@formula/shared';
import { Injectable } from '@nestjs/common';

import { DatabaseService } from '../database/database.service.js';
import type { MessengerAccount, MessengerPerson } from './messenger.types.js';

interface AccountRow {
  id: string;
  user_id: string;
  provider: MessengerBot;
  external_id: string;
  chat_id: string;
  username: string | null;
  phone: string | null;
  phone_verified_at: Date | null;
  notifications_enabled: boolean;
  linked_at: Date;
}

const SELECT = `
  SELECT id, user_id, provider, external_id, chat_id, username, phone, phone_verified_at,
         notifications_enabled, linked_at
  FROM messenger_accounts`;

function toAccount(row: AccountRow): MessengerAccount {
  return {
    id: row.id,
    userId: row.user_id,
    provider: row.provider,
    externalId: row.external_id,
    chatId: row.chat_id,
    username: row.username,
    phone: row.phone,
    phoneVerifiedAt: row.phone_verified_at,
    notificationsEnabled: row.notifications_enabled,
    linkedAt: row.linked_at,
  };
}

@Injectable()
export class MessengersRepository {
  constructor(private readonly database: DatabaseService) {}

  async findByUser(userId: string, provider: MessengerBot): Promise<MessengerAccount | null> {
    const row = await this.database.queryOne<AccountRow>(
      `${SELECT} WHERE user_id = $1 AND provider = $2`,
      [userId, provider],
    );
    return row ? toAccount(row) : null;
  }

  async findByExternal(
    provider: MessengerBot,
    externalId: string,
  ): Promise<MessengerAccount | null> {
    const row = await this.database.queryOne<AccountRow>(
      `${SELECT} WHERE provider = $1 AND external_id = $2`,
      [provider, externalId],
    );
    return row ? toAccount(row) : null;
  }

  /** The account a notification may be sent to: the phone was shared and notifications are on. */
  async findDeliverable(userId: string, provider: MessengerBot): Promise<MessengerAccount | null> {
    const row = await this.database.queryOne<AccountRow>(
      `${SELECT}
       WHERE user_id = $1 AND provider = $2
         AND phone_verified_at IS NOT NULL AND notifications_enabled`,
      [userId, provider],
    );
    return row ? toAccount(row) : null;
  }

  // ---- One-time links ----

  /** Replaces the user's previous links by a new one and sweeps the expired ones. */
  async createToken(
    userId: string,
    provider: MessengerBot,
    tokenHash: string,
    ttlMinutes: number,
  ): Promise<Date> {
    return this.database.transaction(async (tx) => {
      await tx.query(
        `DELETE FROM messenger_link_tokens
         WHERE (user_id = $1 AND provider = $2) OR expires_at < now()`,
        [userId, provider],
      );
      const row = await tx.queryOne<{ expires_at: Date }>(
        `INSERT INTO messenger_link_tokens (token_hash, user_id, provider, expires_at)
         VALUES ($1, $2, $3, now() + make_interval(mins => $4))
         RETURNING expires_at`,
        [tokenHash, userId, provider, ttlMinutes],
      );
      return (row as { expires_at: Date }).expires_at;
    });
  }

  /** Uses a link up: returns the user it was made for, or `null` when it is unknown or expired. */
  async consumeToken(provider: MessengerBot, tokenHash: string): Promise<string | null> {
    const row = await this.database.queryOne<{ user_id: string }>(
      `DELETE FROM messenger_link_tokens
       WHERE token_hash = $1 AND provider = $2 AND expires_at > now()
       RETURNING user_id`,
      [tokenHash, provider],
    );
    return row?.user_id ?? null;
  }

  // ---- Accounts ----

  /**
   * Ties a person in the messenger to a user. The phone starts unverified: the bot asks for it
   * next. A user who connects another person (another Telegram) replaces the earlier one.
   */
  async connect(
    userId: string,
    provider: MessengerBot,
    person: MessengerPerson,
  ): Promise<MessengerAccount> {
    const row = await this.database.queryOne<AccountRow>(
      `INSERT INTO messenger_accounts (user_id, provider, external_id, chat_id, username)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (user_id, provider) DO UPDATE SET
         external_id = EXCLUDED.external_id,
         chat_id = EXCLUDED.chat_id,
         username = EXCLUDED.username,
         -- The same person coming back keeps the verified phone; a different one starts over.
         phone = CASE WHEN messenger_accounts.external_id = EXCLUDED.external_id
                      THEN messenger_accounts.phone END,
         phone_verified_at = CASE WHEN messenger_accounts.external_id = EXCLUDED.external_id
                                  THEN messenger_accounts.phone_verified_at END,
         notifications_enabled = true,
         linked_at = now()
       RETURNING id, user_id, provider, external_id, chat_id, username, phone, phone_verified_at,
                 notifications_enabled, linked_at`,
      [userId, provider, person.externalId, person.chatId, person.username],
    );
    return toAccount(row as AccountRow);
  }

  async confirmPhone(accountId: string, phone: string): Promise<MessengerAccount | null> {
    const row = await this.database.queryOne<AccountRow>(
      `UPDATE messenger_accounts
       SET phone = $2, phone_verified_at = now(), notifications_enabled = true
       WHERE id = $1
       RETURNING id, user_id, provider, external_id, chat_id, username, phone, phone_verified_at,
                 notifications_enabled, linked_at`,
      [accountId, phone],
    );
    return row ? toAccount(row) : null;
  }

  async setUsername(accountId: string, username: string | null): Promise<void> {
    await this.database.query('UPDATE messenger_accounts SET username = $2 WHERE id = $1', [
      accountId,
      username,
    ]);
  }

  async setNotifications(accountId: string, enabled: boolean): Promise<void> {
    await this.database.query(
      'UPDATE messenger_accounts SET notifications_enabled = $2 WHERE id = $1',
      [accountId, enabled],
    );
  }

  async remove(accountId: string): Promise<void> {
    await this.database.query('DELETE FROM messenger_accounts WHERE id = $1', [accountId]);
  }
}
