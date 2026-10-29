import type {
  AdminTestimonial,
  MyTestimonial,
  PublicTestimonial,
  TestimonialCounts,
  TestimonialStatus,
} from '@formula/shared';
import { Injectable } from '@nestjs/common';

import { DatabaseService } from '../database/database.service.js';

interface AdminRow {
  id: string;
  user_id: string | null;
  author_name: string;
  author_surname: string;
  author_email: string;
  author_phone: string | null;
  body: string;
  rating: number;
  status: TestimonialStatus;
  edited_at: Date | null;
  moderated_at: Date | null;
  created_at: Date;
  user_email: string | null;
  avatar_file_id: string | null;
  moderator_id: string | null;
  moderator_name: string | null;
}

interface PublicRow {
  id: string;
  author_name: string;
  author_surname: string;
  body: string;
  rating: number;
  created_at: Date;
  has_avatar: boolean;
}

/** A testimonial as an admin sees it: the author's account and picture, and who moderated it. */
const ADMIN_SELECT = `
  SELECT t.id, t.user_id, t.author_name, t.author_surname, t.author_email, t.author_phone,
         t.body, t.rating, t.status,
         t.edited_at, t.moderated_at, t.created_at,
         u.email AS user_email, p.avatar_file_id,
         m.id AS moderator_id, NULLIF(trim(concat_ws(' ', m.name, m.surname)), '') AS moderator_name
  FROM testimonials t
  LEFT JOIN users u ON u.id = t.user_id
  LEFT JOIN user_profiles p ON p.user_id = t.user_id
  LEFT JOIN users m ON m.id = t.moderated_by`;

function toAdmin(row: AdminRow): AdminTestimonial {
  return {
    id: row.id,
    status: row.status,
    name: row.author_name,
    surname: row.author_surname,
    email: row.author_email,
    phone: row.author_phone,
    text: row.body,
    rating: row.rating,
    author: row.user_id && row.user_email ? { id: row.user_id, email: row.user_email } : null,
    avatarFileId: row.avatar_file_id,
    createdAt: row.created_at.toISOString(),
    editedAt: row.edited_at?.toISOString() ?? null,
    moderatedAt: row.moderated_at?.toISOString() ?? null,
    moderatedBy: row.moderator_id ? { id: row.moderator_id, name: row.moderator_name ?? '' } : null,
  };
}

export interface TestimonialInsert {
  userId: string | null;
  name: string;
  surname: string;
  email: string;
  phone: string | null;
  text: string;
  rating: number;
  ipHash: string | null;
}

export interface TestimonialPatch {
  name?: string;
  surname?: string;
  email?: string;
  /** `undefined` leaves the phone alone, `null` removes it. */
  phone?: string | null;
  text?: string;
  rating?: number;
  status?: TestimonialStatus;
  /** The wording, the name or the rating changed, so the row is marked as edited. */
  edited: boolean;
  moderatorId: string;
}

@Injectable()
export class TestimonialsRepository {
  constructor(private readonly database: DatabaseService) {}

  async insert(input: TestimonialInsert): Promise<string> {
    const row = await this.database.queryOne<{ id: string }>(
      `INSERT INTO testimonials
         (user_id, author_name, author_surname, author_email, author_phone, body, rating, ip_hash)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING id`,
      [
        input.userId,
        input.name,
        input.surname,
        input.email,
        input.phone,
        input.text,
        input.rating,
        input.ipHash,
      ],
    );
    return (row as { id: string }).id;
  }

  async findAdminById(id: string): Promise<AdminTestimonial | null> {
    const row = await this.database.queryOne<AdminRow>(`${ADMIN_SELECT} WHERE t.id = $1`, [id]);
    return row ? toAdmin(row) : null;
  }

  async listAdmin(options: {
    status: TestimonialStatus;
    page: number;
    limit: number;
  }): Promise<{ items: AdminTestimonial[]; total: number }> {
    const rows = await this.database.query<AdminRow & { total: string }>(
      `${ADMIN_SELECT.replace('SELECT t.id,', 'SELECT count(*) OVER() AS total, t.id,')}
       WHERE t.status = $1
       ORDER BY t.created_at DESC, t.id DESC
       LIMIT $2 OFFSET $3`,
      [options.status, options.limit, (options.page - 1) * options.limit],
    );
    return { items: rows.map(toAdmin), total: Number(rows[0]?.total ?? 0) };
  }

  async counts(): Promise<TestimonialCounts> {
    const rows = await this.database.query<{ status: TestimonialStatus; total: string }>(
      'SELECT status, count(*)::text AS total FROM testimonials GROUP BY status',
    );
    const result: TestimonialCounts = { pending: 0, approved: 0, rejected: 0 };
    for (const row of rows) result[row.status] = Number(row.total);
    return result;
  }

  /** Published testimonials, newest first. The author's picture is only flagged, not exposed. */
  async listPublic(limit: number): Promise<PublicTestimonial[]> {
    const rows = await this.database.query<PublicRow>(
      `SELECT t.id, t.author_name, t.author_surname, t.body, t.rating, t.created_at,
              (p.avatar_file_id IS NOT NULL) AS has_avatar
       FROM testimonials t
       LEFT JOIN user_profiles p ON p.user_id = t.user_id
       WHERE t.status = 'approved'
       ORDER BY t.created_at DESC, t.id DESC
       LIMIT $1`,
      [limit],
    );
    return rows.map((row) => ({
      id: row.id,
      authorName: `${row.author_name} ${row.author_surname}`.trim(),
      text: row.body,
      rating: row.rating,
      createdAt: row.created_at.toISOString(),
      hasAvatar: row.has_avatar,
    }));
  }

  async listMine(userId: string): Promise<MyTestimonial[]> {
    const rows = await this.database.query<{
      id: string;
      body: string;
      rating: number;
      status: TestimonialStatus;
      created_at: Date;
    }>(
      `SELECT id, body, rating, status, created_at
       FROM testimonials WHERE user_id = $1
       ORDER BY created_at DESC LIMIT 20`,
      [userId],
    );
    return rows.map((row) => ({
      id: row.id,
      text: row.body,
      rating: row.rating,
      status: row.status,
      createdAt: row.created_at.toISOString(),
    }));
  }

  async countPendingOfUser(userId: string): Promise<number> {
    const row = await this.database.queryOne<{ total: string }>(
      `SELECT count(*)::text AS total FROM testimonials WHERE user_id = $1 AND status = 'pending'`,
      [userId],
    );
    return Number(row?.total ?? 0);
  }

  /** How many a guest behind this address hash sent in the last hour. */
  async countRecentFromIp(ipHash: string): Promise<number> {
    const row = await this.database.queryOne<{ total: string }>(
      `SELECT count(*)::text AS total FROM testimonials
       WHERE ip_hash = $1 AND created_at > now() - interval '1 hour'`,
      [ipHash],
    );
    return Number(row?.total ?? 0);
  }

  async update(id: string, patch: TestimonialPatch): Promise<boolean> {
    const rows = await this.database.query<{ id: string }>(
      `UPDATE testimonials SET
         author_name    = COALESCE($2, author_name),
         author_surname = COALESCE($3, author_surname),
         body           = COALESCE($4, body),
         rating         = COALESCE($5, rating),
         status         = COALESCE($6, status),
         author_email   = COALESCE($9, author_email),
         author_phone   = CASE WHEN $10::boolean THEN $11 ELSE author_phone END,
         edited_at      = CASE WHEN $7::boolean THEN now() ELSE edited_at END,
         moderated_by   = CASE WHEN $6::text IS NOT NULL AND $6::text <> status
                               THEN $8::uuid ELSE moderated_by END,
         moderated_at   = CASE WHEN $6::text IS NOT NULL AND $6::text <> status
                               THEN now() ELSE moderated_at END
       WHERE id = $1
       RETURNING id`,
      [
        id,
        patch.name ?? null,
        patch.surname ?? null,
        patch.text ?? null,
        patch.rating ?? null,
        patch.status ?? null,
        patch.edited,
        patch.moderatorId,
        patch.email ?? null,
        patch.phone !== undefined,
        patch.phone ?? null,
      ],
    );
    return rows.length > 0;
  }

  async remove(id: string): Promise<boolean> {
    const rows = await this.database.query<{ id: string }>(
      'DELETE FROM testimonials WHERE id = $1 RETURNING id',
      [id],
    );
    return rows.length > 0;
  }

  /** The profile picture of the author of a PUBLISHED testimonial (nothing for any other state). */
  async findPublicAvatarFileId(id: string): Promise<string | null> {
    const row = await this.database.queryOne<{ avatar_file_id: string | null }>(
      `SELECT p.avatar_file_id
       FROM testimonials t
       JOIN user_profiles p ON p.user_id = t.user_id
       WHERE t.id = $1 AND t.status = 'approved'`,
      [id],
    );
    return row?.avatar_file_id ?? null;
  }
}
