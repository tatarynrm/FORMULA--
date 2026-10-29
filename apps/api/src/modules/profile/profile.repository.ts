import type {
  InstitutionKind,
  Messenger,
  Profile,
  ProfileMessenger,
  ProfileOption,
} from '@formula/shared';
import { Injectable } from '@nestjs/common';

import { DatabaseService } from '../database/database.service.js';

/** The part of the profile that lives in `user_profiles`; name and email come from `users`. */
export type StoredProfile = Omit<Profile, 'name' | 'surname' | 'email'>;

interface ProfileRow {
  status_code: string | null;
  goal_code: string | null;
  avatar_file_id: string | null;
  institution_kind: InstitutionKind | null;
  institution_name: string | null;
  phone: string | null;
  onboarding_completed_at: Date | null;
}

export interface ProfileChanges {
  statusCode?: string | null;
  goalCode?: string | null;
  avatarFileId?: string | null;
  institutionKind?: InstitutionKind | null;
  institutionName?: string | null;
  /** `+380 98 938 55 85`; `null` removes it. */
  phone?: string | null;
  completeOnboarding?: boolean;
}

const EMPTY: StoredProfile = {
  avatarFileId: null,
  statusCode: null,
  goalCode: null,
  institutionKind: null,
  institutionName: null,
  phone: null,
  messengers: [],
  onboardingCompleted: false,
};

function toStored(row: ProfileRow, messengers: ProfileMessenger[]): StoredProfile {
  return {
    avatarFileId: row.avatar_file_id,
    statusCode: row.status_code,
    goalCode: row.goal_code,
    institutionKind: row.institution_kind,
    institutionName: row.institution_name,
    phone: row.phone,
    messengers,
    onboardingCompleted: row.onboarding_completed_at !== null,
  };
}

@Injectable()
export class ProfileRepository {
  constructor(private readonly database: DatabaseService) {}

  listStatuses(): Promise<ProfileOption[]> {
    return this.database.query<ProfileOption>(
      'SELECT code, label FROM profile_statuses ORDER BY sort_order',
    );
  }

  listGoals(): Promise<ProfileOption[]> {
    return this.database.query<ProfileOption>(
      'SELECT code, label FROM profile_goals ORDER BY sort_order',
    );
  }

  async findMessengers(userId: string): Promise<ProfileMessenger[]> {
    const rows = await this.database.query<{ kind: Messenger; username: string | null }>(
      'SELECT kind, username FROM user_messengers WHERE user_id = $1 ORDER BY kind',
      [userId],
    );
    return rows.map((row) => ({ kind: row.kind, username: row.username }));
  }

  async findByUserId(userId: string): Promise<StoredProfile> {
    const [row, messengers] = await Promise.all([
      this.database.queryOne<ProfileRow>('SELECT * FROM user_profiles WHERE user_id = $1', [
        userId,
      ]),
      this.findMessengers(userId),
    ]);
    return row ? toStored(row, messengers) : { ...EMPTY, messengers };
  }

  /**
   * Creates the profile on first save. A field that is absent keeps its value, an explicit `null`
   * clears it. A profile belongs to one user, so merging in code instead of SQL is safe here.
   */
  async upsert(userId: string, changes: ProfileChanges): Promise<StoredProfile> {
    const current = await this.database.queryOne<ProfileRow>(
      'SELECT * FROM user_profiles WHERE user_id = $1',
      [userId],
    );

    const next = {
      statusCode:
        changes.statusCode !== undefined ? changes.statusCode : (current?.status_code ?? null),
      goalCode: changes.goalCode !== undefined ? changes.goalCode : (current?.goal_code ?? null),
      avatarFileId:
        changes.avatarFileId !== undefined
          ? changes.avatarFileId
          : (current?.avatar_file_id ?? null),
      institutionKind:
        changes.institutionKind !== undefined
          ? changes.institutionKind
          : (current?.institution_kind ?? null),
      institutionName:
        changes.institutionName !== undefined
          ? changes.institutionName
          : (current?.institution_name ?? null),
      phone: changes.phone !== undefined ? changes.phone : (current?.phone ?? null),
    };

    const row = await this.database.queryOne<ProfileRow>(
      `INSERT INTO user_profiles (
         user_id, status_code, goal_code, avatar_file_id, institution_kind, institution_name,
         phone, onboarding_completed_at
       )
       VALUES ($1, $2, $3, $4, $5, $6, $8, CASE WHEN $7::boolean THEN now() END)
       ON CONFLICT (user_id) DO UPDATE SET
         status_code = EXCLUDED.status_code,
         goal_code = EXCLUDED.goal_code,
         avatar_file_id = EXCLUDED.avatar_file_id,
         institution_kind = EXCLUDED.institution_kind,
         institution_name = EXCLUDED.institution_name,
         phone = EXCLUDED.phone,
         onboarding_completed_at = CASE
           WHEN $7::boolean THEN COALESCE(user_profiles.onboarding_completed_at, now())
           ELSE user_profiles.onboarding_completed_at
         END
       RETURNING *`,
      [
        userId,
        next.statusCode,
        next.goalCode,
        next.avatarFileId,
        next.institutionKind,
        next.institutionName,
        changes.completeOnboarding === true,
        next.phone,
      ],
    );
    return row ? toStored(row, await this.findMessengers(userId)) : EMPTY;
  }

  /** Saves the phone only when the profile has none yet (a number verified elsewhere may fill it). */
  async fillPhoneIfEmpty(userId: string, phone: string): Promise<boolean> {
    const rows = await this.database.query<{ user_id: string }>(
      `INSERT INTO user_profiles (user_id, phone) VALUES ($1, $2)
       ON CONFLICT (user_id) DO UPDATE SET phone = EXCLUDED.phone
         WHERE user_profiles.phone IS NULL
       RETURNING user_id`,
      [userId, phone],
    );
    return rows.length > 0;
  }

  /** Replaces the whole list of messengers the person says they use. */
  async replaceMessengers(userId: string, messengers: ProfileMessenger[]): Promise<void> {
    await this.database.transaction(async (tx) => {
      await tx.query('DELETE FROM user_messengers WHERE user_id = $1', [userId]);
      for (const messenger of messengers) {
        await tx.query(
          'INSERT INTO user_messengers (user_id, kind, username) VALUES ($1, $2, $3)',
          [userId, messenger.kind, messenger.username],
        );
      }
    });
  }
}
