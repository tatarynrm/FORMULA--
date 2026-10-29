import { Injectable } from '@nestjs/common';

import { DatabaseService } from '../database/database.service.js';
import type { CreateUserInput, UserRecord, UserRow } from './user.types.js';

function toRecord(row: UserRow): UserRecord {
  return {
    id: row.id,
    email: row.email,
    name: row.name,
    surname: row.surname,
    passwordHash: row.password_hash,
    googleId: row.google_id,
    lastLoginAt: row.last_login_at,
    createdAt: row.created_at,
    onboardingCompleted: row.onboarding_completed_at !== null,
    avatarFileId: row.avatar_file_id,
  };
}

/** Every read joins the profile, so the onboarding flag and the avatar are always known. */
const SELECT_USER = `
  SELECT u.*, p.onboarding_completed_at, p.avatar_file_id
  FROM users u
  LEFT JOIN user_profiles p ON p.user_id = u.id`;

@Injectable()
export class UsersRepository {
  constructor(private readonly database: DatabaseService) {}

  async findByEmail(email: string): Promise<UserRecord | null> {
    const row = await this.database.queryOne<UserRow>(`${SELECT_USER} WHERE u.email = $1`, [email]);
    return row ? toRecord(row) : null;
  }

  async findById(id: string): Promise<UserRecord | null> {
    const row = await this.database.queryOne<UserRow>(`${SELECT_USER} WHERE u.id = $1`, [id]);
    return row ? toRecord(row) : null;
  }

  /** Throws a pg unique violation (23505) when the email is already registered. */
  async create(input: CreateUserInput): Promise<UserRecord> {
    const inserted = await this.database.queryOne<{ id: string }>(
      `INSERT INTO users (email, name, surname, password_hash, google_id)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id`,
      [input.email, input.name, input.surname, input.passwordHash, input.googleId ?? null],
    );
    const created = inserted ? await this.findById(inserted.id) : null;
    if (!created) {
      throw new Error('INSERT INTO users returned no row');
    }
    return created;
  }

  async findByGoogleId(googleId: string): Promise<UserRecord | null> {
    const row = await this.database.queryOne<UserRow>(`${SELECT_USER} WHERE u.google_id = $1`, [
      googleId,
    ]);
    return row ? toRecord(row) : null;
  }

  /** Ties an existing account (found by email) to the Google account that signed in. */
  async linkGoogle(id: string, googleId: string): Promise<void> {
    await this.database.query('UPDATE users SET google_id = $2 WHERE id = $1', [id, googleId]);
  }

  async touchLastLogin(id: string): Promise<void> {
    await this.database.query('UPDATE users SET last_login_at = now() WHERE id = $1', [id]);
  }

  async updateNames(id: string, name: string, surname: string): Promise<void> {
    await this.database.query('UPDATE users SET name = $2, surname = $3 WHERE id = $1', [
      id,
      name,
      surname,
    ]);
  }

  async updatePasswordHash(id: string, passwordHash: string): Promise<void> {
    await this.database.query('UPDATE users SET password_hash = $2 WHERE id = $1', [
      id,
      passwordHash,
    ]);
  }
}
