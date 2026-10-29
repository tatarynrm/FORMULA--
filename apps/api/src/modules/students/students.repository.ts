import type {
  MessengerBot,
  StudentListItem,
  StudentListQuery,
  StudentProfileInfo,
} from '@formula/shared';
import { Injectable } from '@nestjs/common';

import { DatabaseService } from '../database/database.service.js';

interface StudentBotRow {
  provider: MessengerBot;
  awaitingPhone: boolean;
  username: string | null;
  phone: string | null;
  notificationsEnabled: boolean;
}

interface StudentRow {
  id: string;
  email: string;
  name: string;
  surname: string;
  has_password: boolean;
  google_linked: boolean;
  last_login_at: Date | null;
  last_seen_at: Date | null;
  created_at: Date;
  onboarding_completed_at: Date | null;
  avatar_file_id: string | null;
  status_code: string | null;
  status_label: string | null;
  goal_code: string | null;
  goal_label: string | null;
  institution_kind: 'university' | 'other' | null;
  institution_name: string | null;
  phone: string | null;
  messengers: StudentProfileInfo['messengers'];
  bots: StudentBotRow[];
  tests_passed: string;
  average_percent: string | null;
  subject_grants: string;
  subtopic_grants: string;
  total: string;
}

/** Everything the list and the detail page show about a student, without the live online flag. */
export type StudentBase = Omit<StudentListItem, 'presence'> & { lastSeenAt: Date | null };

/** How the "online only" filter is narrowed: by the ids Redis knows, or by the stored time. */
export type OnlineFilter = { ids: string[] } | { since: Date } | null;

const SELECT_STUDENT = `
  SELECT u.id, u.email, u.name, u.surname,
         u.password_hash IS NOT NULL AS has_password,
         u.google_id IS NOT NULL AS google_linked,
         u.last_login_at, u.last_seen_at, u.created_at,
         p.onboarding_completed_at, p.avatar_file_id,
         p.status_code, ps.label AS status_label,
         p.goal_code, pg.label AS goal_label,
         p.institution_kind, p.institution_name, p.phone,
         COALESCE((SELECT json_agg(json_build_object('kind', m.kind, 'username', m.username)
                                   ORDER BY m.kind)
                   FROM user_messengers m WHERE m.user_id = u.id), '[]'::json) AS messengers,
         COALESCE((SELECT json_agg(json_build_object(
                          'provider', ma.provider,
                          'awaitingPhone', ma.phone_verified_at IS NULL,
                          'username', ma.username,
                          'phone', ma.phone,
                          'notificationsEnabled', ma.notifications_enabled)
                          ORDER BY ma.provider)
                   FROM messenger_accounts ma WHERE ma.user_id = u.id), '[]'::json) AS bots,
         (SELECT count(DISTINCT a.test_id) FROM attempts a
            WHERE a.user_id = u.id AND a.status <> 'in_progress') AS tests_passed,
         (SELECT round(avg(best)) FROM (
            SELECT max(a.score / a.max_score * 100) AS best FROM attempts a
            WHERE a.user_id = u.id AND a.status IN ('completed', 'reviewed') AND a.max_score > 0
            GROUP BY a.test_id
          ) results) AS average_percent,
         (SELECT count(*) FROM subject_access sa WHERE sa.user_id = u.id) AS subject_grants,
         (SELECT count(*) FROM subtopic_access st WHERE st.user_id = u.id) AS subtopic_grants,
         count(*) OVER () AS total
  FROM users u
  LEFT JOIN user_profiles p ON p.user_id = u.id
  LEFT JOIN profile_statuses ps ON ps.code = p.status_code
  LEFT JOIN profile_goals pg ON pg.code = p.goal_code
  WHERE NOT EXISTS (SELECT 1 FROM admins ad WHERE ad.user_id = u.id)`;

const ORDER: Record<NonNullable<StudentListQuery['sort']>, string> = {
  newest: 'u.created_at DESC, u.id',
  name: 'u.surname, u.name, u.id',
  lastSeen: 'u.last_seen_at DESC NULLS LAST, u.id',
};

function toBase(row: StudentRow): StudentBase {
  return {
    id: row.id,
    email: row.email,
    name: row.name,
    surname: row.surname,
    role: 'student',
    adminLevel: null,
    onboardingCompleted: row.onboarding_completed_at !== null,
    avatarFileId: row.avatar_file_id,
    hasPassword: row.has_password,
    createdAt: row.created_at.toISOString(),
    lastLoginAt: row.last_login_at?.toISOString() ?? null,
    lastSeenAt: row.last_seen_at,
    googleLinked: row.google_linked,
    profile: {
      statusCode: row.status_code,
      statusLabel: row.status_label,
      goalCode: row.goal_code,
      goalLabel: row.goal_label,
      institutionKind: row.institution_kind,
      institutionName: row.institution_name,
      phone: row.phone,
      messengers: row.messengers,
      bots: row.bots,
      onboardingCompleted: row.onboarding_completed_at !== null,
    },
    stats: {
      testsPassed: Number(row.tests_passed),
      averagePercent: row.average_percent === null ? null : Number(row.average_percent),
      subjectGrants: Number(row.subject_grants),
      subtopicGrants: Number(row.subtopic_grants),
    },
  };
}

@Injectable()
export class StudentsRepository {
  constructor(private readonly database: DatabaseService) {}

  async findPage(
    query: Required<Pick<StudentListQuery, 'page' | 'limit' | 'sort'>> & { q: string | null },
    online: OnlineFilter,
  ): Promise<{ items: StudentBase[]; total: number }> {
    const onlineIds = online && 'ids' in online ? online.ids : null;
    const onlineSince = online && 'since' in online ? online.since : null;

    const rows = await this.database.query<StudentRow>(
      `${SELECT_STUDENT}
         AND ($3::text IS NULL
              OR u.email ILIKE '%' || $3 || '%'
              OR (u.name || ' ' || u.surname) ILIKE '%' || $3 || '%'
              OR (u.surname || ' ' || u.name) ILIKE '%' || $3 || '%')
         AND ($4::uuid[] IS NULL OR u.id = ANY($4::uuid[]))
         AND ($5::timestamptz IS NULL OR u.last_seen_at > $5)
       ORDER BY ${ORDER[query.sort]}
       LIMIT $1 OFFSET $2`,
      [query.limit, (query.page - 1) * query.limit, query.q, onlineIds, onlineSince],
    );
    return { items: rows.map(toBase), total: Number(rows[0]?.total ?? 0) };
  }

  async findOne(id: string): Promise<StudentBase | null> {
    const row = await this.database.queryOne<StudentRow>(`${SELECT_STUDENT} AND u.id = $1`, [id]);
    return row ? toBase(row) : null;
  }

  /** Deletes a student (never an admin); every attempt, grant and session goes with the account. */
  async delete(id: string): Promise<boolean> {
    const rows = await this.database.query(
      `DELETE FROM users u WHERE u.id = $1 AND NOT EXISTS (SELECT 1 FROM admins a WHERE a.user_id = u.id)
       RETURNING id`,
      [id],
    );
    return rows.length > 0;
  }
}
