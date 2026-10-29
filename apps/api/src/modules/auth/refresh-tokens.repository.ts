import { Injectable } from '@nestjs/common';

import { DatabaseService } from '../database/database.service.js';

interface RefreshTokenRow {
  id: string;
  user_id: string;
  family_id: string;
  expires_at: Date;
  revoked_at: Date | null;
}

export interface RefreshTokenRecord {
  id: string;
  userId: string;
  familyId: string;
  expiresAt: Date;
  revokedAt: Date | null;
}

export interface CreateRefreshTokenInput {
  id: string;
  userId: string;
  familyId: string;
  expiresAt: Date;
}

@Injectable()
export class RefreshTokensRepository {
  constructor(private readonly database: DatabaseService) {}

  async create(input: CreateRefreshTokenInput): Promise<void> {
    await this.database.query(
      `INSERT INTO refresh_tokens (id, user_id, family_id, expires_at)
       VALUES ($1, $2, $3, $4)`,
      [input.id, input.userId, input.familyId, input.expiresAt],
    );
  }

  async findById(id: string): Promise<RefreshTokenRecord | null> {
    const row = await this.database.queryOne<RefreshTokenRow>(
      'SELECT id, user_id, family_id, expires_at, revoked_at FROM refresh_tokens WHERE id = $1',
      [id],
    );
    return row
      ? {
          id: row.id,
          userId: row.user_id,
          familyId: row.family_id,
          expiresAt: row.expires_at,
          revokedAt: row.revoked_at,
        }
      : null;
  }

  /**
   * Atomically revokes a still-active token. Returns false when somebody else already did,
   * so two concurrent refreshes with the same token cannot both succeed.
   */
  async revokeIfActive(id: string): Promise<boolean> {
    const rows = await this.database.query<{ id: string }>(
      `UPDATE refresh_tokens SET revoked_at = now()
       WHERE id = $1 AND revoked_at IS NULL AND expires_at > now()
       RETURNING id`,
      [id],
    );
    return rows.length > 0;
  }

  async revokeFamily(familyId: string): Promise<void> {
    await this.database.query(
      'UPDATE refresh_tokens SET revoked_at = now() WHERE family_id = $1 AND revoked_at IS NULL',
      [familyId],
    );
  }

  /** Ends every session of a user (after a password change, for example). */
  async revokeAllForUser(userId: string): Promise<void> {
    await this.database.query(
      'UPDATE refresh_tokens SET revoked_at = now() WHERE user_id = $1 AND revoked_at IS NULL',
      [userId],
    );
  }

  // TODO: run on a schedule (e.g. daily) once a scheduler exists; rows are harmless until then.
  async deleteExpired(): Promise<number> {
    const rows = await this.database.query<{ id: string }>(
      "DELETE FROM refresh_tokens WHERE expires_at < now() - interval '1 day' RETURNING id",
    );
    return rows.length;
  }
}
