import { Injectable } from '@nestjs/common';

import { DatabaseService } from '../database/database.service.js';

export interface NewsRecipient {
  id: string;
  email: string;
  name: string;
}

@Injectable()
export class MailRepository {
  constructor(private readonly database: DatabaseService) {}

  /** Students (not admins) who did not switch the news emails off. */
  async listNewsRecipients(): Promise<NewsRecipient[]> {
    return this.database.query<NewsRecipient>(
      `SELECT u.id, u.email, u.name
       FROM users u
       WHERE u.email_news_enabled
         AND NOT EXISTS (SELECT 1 FROM admins a WHERE a.user_id = u.id)
       ORDER BY u.created_at`,
    );
  }

  /** Returns false when there is no such user. */
  async setNewsEnabled(userId: string, enabled: boolean): Promise<boolean> {
    const rows = await this.database.query<{ id: string }>(
      'UPDATE users SET email_news_enabled = $2 WHERE id = $1 RETURNING id',
      [userId, enabled],
    );
    return rows.length > 0;
  }
}
