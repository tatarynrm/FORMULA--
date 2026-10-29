import { PRESENCE, type PresenceSession } from '@formula/shared';
import { Injectable } from '@nestjs/common';

import { DatabaseService } from '../database/database.service.js';

interface SessionRow {
  id: string;
  started_at: Date;
  last_seen_at: Date;
}

/** The durable half of online tracking: `users.last_seen_at` and the session history. */
@Injectable()
export class PresenceRepository {
  constructor(private readonly database: DatabaseService) {}

  /**
   * Records that the user is active now. The latest session is extended when the pause since
   * its last request is shorter than the session gap; otherwise a new session starts.
   */
  async markSeen(userId: string): Promise<void> {
    await this.database.transaction(async (tx) => {
      await tx.query('UPDATE users SET last_seen_at = now() WHERE id = $1', [userId]);

      const extended = await tx.query(
        `UPDATE user_sessions SET last_seen_at = now()
         WHERE id = (
           SELECT id FROM user_sessions
           WHERE user_id = $1 AND last_seen_at > now() - ($2::int * interval '1 second')
           ORDER BY last_seen_at DESC LIMIT 1
         )
         RETURNING id`,
        [userId, PRESENCE.SESSION_GAP_SECONDS],
      );
      if (extended.length === 0) {
        await tx.query('INSERT INTO user_sessions (user_id) VALUES ($1)', [userId]);
      }
    });
  }

  /** Last request of each user (`null` when the user never signed in or is unknown). */
  async findLastSeen(userIds: string[]): Promise<Map<string, Date | null>> {
    if (userIds.length === 0) return new Map();
    const rows = await this.database.query<{ id: string; last_seen_at: Date | null }>(
      'SELECT id, last_seen_at FROM users WHERE id = ANY($1::uuid[])',
      [userIds],
    );
    return new Map(rows.map((row) => [row.id, row.last_seen_at]));
  }

  async findSessions(userId: string, limit: number): Promise<PresenceSession[]> {
    const rows = await this.database.query<SessionRow>(
      `SELECT id, started_at, last_seen_at FROM user_sessions
       WHERE user_id = $1 ORDER BY started_at DESC LIMIT $2`,
      [userId, limit],
    );
    return rows.map((row) => ({
      id: row.id,
      startedAt: row.started_at.toISOString(),
      lastSeenAt: row.last_seen_at.toISOString(),
      durationSeconds: Math.max(
        0,
        Math.round((row.last_seen_at.getTime() - row.started_at.getTime()) / 1000),
      ),
    }));
  }

  async countActiveDays(userId: string, days: number): Promise<number> {
    const row = await this.database.queryOne<{ total: string }>(
      `SELECT count(DISTINCT date_trunc('day', started_at))::text AS total FROM user_sessions
       WHERE user_id = $1 AND started_at > now() - ($2::int * interval '1 day')`,
      [userId, days],
    );
    return Number(row?.total ?? 0);
  }
}
