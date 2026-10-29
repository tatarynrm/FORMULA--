import type {
  AdminSubject,
  AdminSubtopicSummary,
  AdminTopic,
  ContentStatus,
  MaterialKind,
  Material,
  CatalogSubtopic,
  SubjectGrant,
  SubtopicGrant,
} from '@formula/shared';
import { Injectable } from '@nestjs/common';

import { DatabaseService } from '../database/database.service.js';

// ---- Row types ----

interface SubjectRow {
  id: string;
  title: string;
  description: string | null;
  status: ContentStatus;
  sort_order: number;
  topic_count: string;
}

interface TopicRow {
  id: string;
  subject_id: string;
  title: string;
  status: ContentStatus;
  sort_order: number;
}

interface SubtopicRow {
  id: string;
  topic_id: string;
  title: string;
  description_html: string;
  is_free: boolean;
  status: ContentStatus;
  sort_order: number;
  material_count: string;
  test_count: string;
}

interface SubtopicContextRow extends SubtopicRow {
  topic_title: string;
  subject_id: string;
  subject_title: string;
  topic_status: ContentStatus;
  subject_status: ContentStatus;
}

interface MaterialRow {
  id: string;
  kind: MaterialKind;
  title: string;
  file_id: string;
  original_name: string;
  mime_type: string;
  size_bytes: string;
  sort_order: number;
}

export interface StudentSubtopicRow {
  id: string;
  topic_id: string;
  title: string;
  is_free: boolean;
  has_access: boolean;
  test_count: string;
}

export interface SubtopicContext {
  id: string;
  topicId: string;
  title: string;
  descriptionHtml: string;
  isFree: boolean;
  status: ContentStatus;
  topicTitle: string;
  subjectId: string;
  subjectTitle: string;
  /** Visible to students only when the subtopic, its topic and its subject are all published. */
  visible: boolean;
}

function toMaterial(row: MaterialRow): Material {
  return {
    id: row.id,
    kind: row.kind,
    title: row.title,
    fileId: row.file_id,
    fileName: row.original_name,
    mimeType: row.mime_type,
    sizeBytes: Number(row.size_bytes),
    sortOrder: row.sort_order,
  };
}

function toSubtopicSummary(row: SubtopicRow): AdminSubtopicSummary {
  return {
    id: row.id,
    topicId: row.topic_id,
    title: row.title,
    status: row.status,
    isFree: row.is_free,
    sortOrder: row.sort_order,
    materialCount: Number(row.material_count),
    testCount: Number(row.test_count),
  };
}

const SUBTOPIC_COUNTS = `
  (SELECT count(*) FROM materials m WHERE m.subtopic_id = s.id) AS material_count,
  (SELECT count(*) FROM tests t WHERE t.subtopic_id = s.id) AS test_count`;

const MATERIAL_SELECT = `
  SELECT m.id, m.kind, m.title, m.file_id, f.original_name, f.mime_type, f.size_bytes, m.sort_order
  FROM materials m
  JOIN files f ON f.id = m.file_id`;

@Injectable()
export class CatalogRepository {
  constructor(private readonly database: DatabaseService) {}

  // ---- Subjects ----

  async listSubjects(): Promise<AdminSubject[]> {
    const rows = await this.database.query<SubjectRow>(
      `SELECT s.*, (SELECT count(*) FROM topics t WHERE t.subject_id = s.id) AS topic_count
       FROM subjects s ORDER BY s.sort_order, s.created_at`,
    );
    return rows.map(toSubject);
  }

  async findSubject(id: string): Promise<AdminSubject | null> {
    const row = await this.database.queryOne<SubjectRow>(
      `SELECT s.*, (SELECT count(*) FROM topics t WHERE t.subject_id = s.id) AS topic_count
       FROM subjects s WHERE s.id = $1`,
      [id],
    );
    return row ? toSubject(row) : null;
  }

  async createSubject(title: string, description: string | null): Promise<string> {
    const row = await this.database.queryOne<{ id: string }>(
      `INSERT INTO subjects (title, description, sort_order)
       VALUES ($1, $2, COALESCE((SELECT max(sort_order) FROM subjects), 0) + 10)
       RETURNING id`,
      [title, description],
    );
    if (!row) throw new Error('INSERT INTO subjects returned no row');
    return row.id;
  }

  async updateSubject(
    id: string,
    patch: { title?: string; description?: string | null; status?: ContentStatus },
  ): Promise<boolean> {
    const rows = await this.database.query(
      `UPDATE subjects SET
         title = COALESCE($2, title),
         description = CASE WHEN $3::boolean THEN $4 ELSE description END,
         status = COALESCE($5, status)
       WHERE id = $1 RETURNING id`,
      [
        id,
        patch.title ?? null,
        patch.description !== undefined,
        patch.description ?? null,
        patch.status ?? null,
      ],
    );
    return rows.length > 0;
  }

  async deleteSubject(id: string): Promise<boolean> {
    return (
      (await this.database.query('DELETE FROM subjects WHERE id = $1 RETURNING id', [id])).length >
      0
    );
  }

  // ---- Topics ----

  async listTopics(subjectId: string): Promise<AdminTopic[]> {
    const topics = await this.database.query<TopicRow>(
      'SELECT * FROM topics WHERE subject_id = $1 ORDER BY sort_order, created_at',
      [subjectId],
    );
    const subtopics = await this.database.query<SubtopicRow>(
      `SELECT s.*, ${SUBTOPIC_COUNTS}
       FROM subtopics s JOIN topics t ON t.id = s.topic_id
       WHERE t.subject_id = $1 ORDER BY s.sort_order, s.created_at`,
      [subjectId],
    );

    return topics.map((topic) => ({
      id: topic.id,
      subjectId: topic.subject_id,
      title: topic.title,
      status: topic.status,
      sortOrder: topic.sort_order,
      subtopics: subtopics
        .filter((subtopic) => subtopic.topic_id === topic.id)
        .map(toSubtopicSummary),
    }));
  }

  async createTopic(subjectId: string, title: string): Promise<string | null> {
    const row = await this.database.queryOne<{ id: string }>(
      `INSERT INTO topics (subject_id, title, sort_order)
       SELECT $1, $2, COALESCE((SELECT max(sort_order) FROM topics WHERE subject_id = $1), 0) + 10
       WHERE EXISTS (SELECT 1 FROM subjects WHERE id = $1)
       RETURNING id`,
      [subjectId, title],
    );
    return row?.id ?? null;
  }

  async updateTopic(
    id: string,
    patch: { title?: string; status?: ContentStatus },
  ): Promise<boolean> {
    const rows = await this.database.query(
      `UPDATE topics SET title = COALESCE($2, title), status = COALESCE($3, status)
       WHERE id = $1 RETURNING id`,
      [id, patch.title ?? null, patch.status ?? null],
    );
    return rows.length > 0;
  }

  async deleteTopic(id: string): Promise<boolean> {
    return (
      (await this.database.query('DELETE FROM topics WHERE id = $1 RETURNING id', [id])).length > 0
    );
  }

  // ---- Subtopics ----

  async createSubtopic(topicId: string, title: string, isFree: boolean): Promise<string | null> {
    const row = await this.database.queryOne<{ id: string }>(
      `INSERT INTO subtopics (topic_id, title, is_free, sort_order)
       SELECT $1, $2, $3, COALESCE((SELECT max(sort_order) FROM subtopics WHERE topic_id = $1), 0) + 10
       WHERE EXISTS (SELECT 1 FROM topics WHERE id = $1)
       RETURNING id`,
      [topicId, title, isFree],
    );
    return row?.id ?? null;
  }

  async updateSubtopic(
    id: string,
    patch: { title?: string; descriptionHtml?: string; isFree?: boolean; status?: ContentStatus },
  ): Promise<boolean> {
    const rows = await this.database.query(
      `UPDATE subtopics SET
         title = COALESCE($2, title),
         description_html = COALESCE($3, description_html),
         is_free = COALESCE($4, is_free),
         status = COALESCE($5, status)
       WHERE id = $1 RETURNING id`,
      [
        id,
        patch.title ?? null,
        patch.descriptionHtml ?? null,
        patch.isFree ?? null,
        patch.status ?? null,
      ],
    );
    return rows.length > 0;
  }

  async deleteSubtopic(id: string): Promise<boolean> {
    return (
      (await this.database.query('DELETE FROM subtopics WHERE id = $1 RETURNING id', [id])).length >
      0
    );
  }

  /** A subtopic with its topic and subject, whatever their status. */
  async findSubtopicContext(
    id: string,
  ): Promise<(SubtopicContext & { materialCount: number; testCount: number }) | null> {
    const row = await this.database.queryOne<SubtopicContextRow>(
      `SELECT s.*, ${SUBTOPIC_COUNTS},
              t.title AS topic_title, t.status AS topic_status,
              sj.id AS subject_id, sj.title AS subject_title, sj.status AS subject_status
       FROM subtopics s
       JOIN topics t ON t.id = s.topic_id
       JOIN subjects sj ON sj.id = t.subject_id
       WHERE s.id = $1`,
      [id],
    );
    if (!row) return null;

    return {
      id: row.id,
      topicId: row.topic_id,
      title: row.title,
      descriptionHtml: row.description_html,
      isFree: row.is_free,
      status: row.status,
      topicTitle: row.topic_title,
      subjectId: row.subject_id,
      subjectTitle: row.subject_title,
      visible:
        row.status === 'published' &&
        row.topic_status === 'published' &&
        row.subject_status === 'published',
      materialCount: Number(row.material_count),
      testCount: Number(row.test_count),
    };
  }

  // ---- Materials ----

  async listMaterials(subtopicId: string): Promise<Material[]> {
    const rows = await this.database.query<MaterialRow>(
      `${MATERIAL_SELECT} WHERE m.subtopic_id = $1 ORDER BY m.sort_order, m.created_at`,
      [subtopicId],
    );
    return rows.map(toMaterial);
  }

  /** Adds a material only if the file exists and has the matching purpose (video / document). */
  async createMaterial(input: {
    subtopicId: string;
    kind: MaterialKind;
    title: string;
    fileId: string;
  }): Promise<Material | null> {
    const row = await this.database.queryOne<{ id: string }>(
      `INSERT INTO materials (subtopic_id, kind, title, file_id, sort_order)
       SELECT $1, $2, $3, f.id,
              COALESCE((SELECT max(sort_order) FROM materials WHERE subtopic_id = $1), 0) + 10
       FROM files f
       WHERE f.id = $4 AND f.purpose = $2
         AND EXISTS (SELECT 1 FROM subtopics WHERE id = $1)
       RETURNING id`,
      [input.subtopicId, input.kind, input.title, input.fileId],
    );
    if (!row) return null;

    const created = await this.database.queryOne<MaterialRow>(
      `${MATERIAL_SELECT} WHERE m.id = $1`,
      [row.id],
    );
    return created ? toMaterial(created) : null;
  }

  async renameMaterial(id: string, title: string): Promise<boolean> {
    return (
      (
        await this.database.query('UPDATE materials SET title = $2 WHERE id = $1 RETURNING id', [
          id,
          title,
        ])
      ).length > 0
    );
  }

  /** Deletes the material and returns the id of its file (to clean the file up), or `null` if it was not there. */
  async deleteMaterial(id: string): Promise<string | null> {
    const row = await this.database.queryOne<{ file_id: string }>(
      'DELETE FROM materials WHERE id = $1 RETURNING file_id',
      [id],
    );
    return row?.file_id ?? null;
  }

  // ---- Order (admin) ----
  // Each statement renumbers the given ids 10, 20, 30... in the order sent, only inside their parent.

  async reorderSubjects(ids: string[]): Promise<void> {
    await this.database.query(
      `UPDATE subjects s SET sort_order = o.ord * 10
       FROM unnest($1::uuid[]) WITH ORDINALITY AS o(id, ord)
       WHERE s.id = o.id`,
      [ids],
    );
  }

  async reorderTopics(subjectId: string, ids: string[]): Promise<void> {
    await this.database.query(
      `UPDATE topics t SET sort_order = o.ord * 10
       FROM unnest($2::uuid[]) WITH ORDINALITY AS o(id, ord)
       WHERE t.id = o.id AND t.subject_id = $1`,
      [subjectId, ids],
    );
  }

  async reorderSubtopics(topicId: string, ids: string[]): Promise<void> {
    await this.database.query(
      `UPDATE subtopics s SET sort_order = o.ord * 10
       FROM unnest($2::uuid[]) WITH ORDINALITY AS o(id, ord)
       WHERE s.id = o.id AND s.topic_id = $1`,
      [topicId, ids],
    );
  }

  async reorderMaterials(subtopicId: string, ids: string[]): Promise<void> {
    await this.database.query(
      `UPDATE materials m SET sort_order = o.ord * 10
       FROM unnest($2::uuid[]) WITH ORDINALITY AS o(id, ord)
       WHERE m.id = o.id AND m.subtopic_id = $1`,
      [subtopicId, ids],
    );
  }

  // ---- Student catalog ----

  /** Published subjects with published topics and subtopics. `isAdmin` opens everything for previews. */
  async findPublishedTree(
    userId: string,
    isAdmin: boolean,
    subjectId?: string,
  ): Promise<{
    subjects: { id: string; title: string; description: string | null; full_access: boolean }[];
    topics: { id: string; subject_id: string; title: string }[];
    subtopics: (StudentSubtopicRow & { subject_id: string })[];
  }> {
    const subjects = await this.database.query<{
      id: string;
      title: string;
      description: string | null;
      full_access: boolean;
    }>(
      `SELECT sj.id, sj.title, sj.description,
              ($3::boolean OR EXISTS (
                 SELECT 1 FROM subject_access sa
                 WHERE sa.subject_id = sj.id AND sa.user_id = $2
                   AND (sa.expires_at IS NULL OR sa.expires_at > now())
              )) AS full_access
       FROM subjects sj
       WHERE sj.status = 'published' AND ($1::uuid IS NULL OR sj.id = $1)
       ORDER BY sj.sort_order, sj.created_at`,
      [subjectId ?? null, userId, isAdmin],
    );
    const topics = await this.database.query<{ id: string; subject_id: string; title: string }>(
      `SELECT t.id, t.subject_id, t.title FROM topics t
       JOIN subjects s ON s.id = t.subject_id AND s.status = 'published'
       WHERE t.status = 'published' AND ($1::uuid IS NULL OR t.subject_id = $1)
       ORDER BY t.sort_order, t.created_at`,
      [subjectId ?? null],
    );
    const subtopics = await this.database.query<StudentSubtopicRow & { subject_id: string }>(
      `SELECT s.id, s.topic_id, s.title, s.is_free, t.subject_id,
              ($3::boolean OR has_subtopic_access($2, s.id)) AS has_access,
              (SELECT count(*) FROM tests x WHERE x.subtopic_id = s.id AND x.status = 'published') AS test_count
       FROM subtopics s
       JOIN topics t ON t.id = s.topic_id AND t.status = 'published'
       JOIN subjects sj ON sj.id = t.subject_id AND sj.status = 'published'
       WHERE s.status = 'published' AND ($1::uuid IS NULL OR t.subject_id = $1)
       ORDER BY s.sort_order, s.created_at`,
      [subjectId ?? null, userId, isAdmin],
    );
    return { subjects, topics, subtopics };
  }

  async hasAccess(userId: string, subtopicId: string): Promise<boolean> {
    const row = await this.database.queryOne<{ ok: boolean }>(
      `SELECT has_subtopic_access($2, s.id) AS ok
       FROM subtopics s WHERE s.id = $1`,
      [subtopicId, userId],
    );
    return row?.ok ?? false;
  }

  // ---- Access grants (admin) ----

  async listGrants(userId: string): Promise<SubtopicGrant[]> {
    const rows = await this.database.query<{
      subtopic_id: string;
      subtopic_title: string;
      topic_title: string;
      subject_title: string;
      source: 'manual' | 'payment';
      created_at: Date;
    }>(
      `SELECT a.subtopic_id, s.title AS subtopic_title, t.title AS topic_title, sj.title AS subject_title,
              a.source, a.created_at
       FROM subtopic_access a
       JOIN subtopics s ON s.id = a.subtopic_id
       JOIN topics t ON t.id = s.topic_id
       JOIN subjects sj ON sj.id = t.subject_id
       WHERE a.user_id = $1
       ORDER BY sj.title, t.title, s.title`,
      [userId],
    );
    return rows.map((row) => ({
      subtopicId: row.subtopic_id,
      subtopicTitle: row.subtopic_title,
      topicTitle: row.topic_title,
      subjectTitle: row.subject_title,
      source: row.source,
      createdAt: row.created_at.toISOString(),
    }));
  }

  async grant(userId: string, subtopicId: string, grantedBy: string): Promise<boolean> {
    const rows = await this.database.query(
      `INSERT INTO subtopic_access (user_id, subtopic_id, granted_by)
       SELECT u.id, s.id, $3 FROM users u, subtopics s WHERE u.id = $1 AND s.id = $2
       ON CONFLICT (user_id, subtopic_id) DO UPDATE SET expires_at = NULL
       RETURNING user_id`,
      [userId, subtopicId, grantedBy],
    );
    return rows.length > 0;
  }

  async revoke(userId: string, subtopicId: string): Promise<void> {
    await this.database.query(
      'DELETE FROM subtopic_access WHERE user_id = $1 AND subtopic_id = $2',
      [userId, subtopicId],
    );
  }

  async listSubjectGrants(userId: string): Promise<SubjectGrant[]> {
    const rows = await this.database.query<{
      subject_id: string;
      subject_title: string;
      source: 'manual' | 'payment';
      created_at: Date;
    }>(
      `SELECT sa.subject_id, sj.title AS subject_title, sa.source, sa.created_at
       FROM subject_access sa
       JOIN subjects sj ON sj.id = sa.subject_id
       WHERE sa.user_id = $1
       ORDER BY sj.sort_order, sj.title`,
      [userId],
    );
    return rows.map((row) => ({
      subjectId: row.subject_id,
      subjectTitle: row.subject_title,
      source: row.source,
      createdAt: row.created_at.toISOString(),
    }));
  }

  /** Opens a whole subject (all its subtopics, also the ones added later). */
  async grantSubject(userId: string, subjectId: string, grantedBy: string): Promise<boolean> {
    const rows = await this.database.query(
      `INSERT INTO subject_access (user_id, subject_id, granted_by)
       SELECT u.id, sj.id, $3 FROM users u, subjects sj WHERE u.id = $1 AND sj.id = $2
       ON CONFLICT (user_id, subject_id) DO UPDATE SET expires_at = NULL
       RETURNING user_id`,
      [userId, subjectId, grantedBy],
    );
    return rows.length > 0;
  }

  async revokeSubject(userId: string, subjectId: string): Promise<void> {
    await this.database.query('DELETE FROM subject_access WHERE user_id = $1 AND subject_id = $2', [
      userId,
      subjectId,
    ]);
  }

  /** Flat list for the "give access" picker. */
  async listAllSubtopics(): Promise<CatalogSubtopic[]> {
    const rows = await this.database.query<{
      id: string;
      title: string;
      is_free: boolean;
      topic_id: string;
      topic_title: string;
      subject_id: string;
      subject_title: string;
    }>(
      `SELECT s.id, s.title, s.is_free, t.id AS topic_id, t.title AS topic_title,
              sj.id AS subject_id, sj.title AS subject_title
       FROM subtopics s
       JOIN topics t ON t.id = s.topic_id
       JOIN subjects sj ON sj.id = t.subject_id
       ORDER BY sj.sort_order, sj.created_at, t.sort_order, t.created_at, s.sort_order, s.created_at`,
    );
    return rows.map((row) => ({
      id: row.id,
      title: row.title,
      isFree: row.is_free,
      topicId: row.topic_id,
      topicTitle: row.topic_title,
      subjectId: row.subject_id,
      subjectTitle: row.subject_title,
    }));
  }

  /**
   * Makes the individual subtopic grants of a student exactly `subtopicIds`: missing ones are
   * added, the others removed, in one transaction. Unknown ids are ignored. Grants on whole
   * subjects are not touched.
   */
  async setGrants(userId: string, subtopicIds: string[], grantedBy: string): Promise<void> {
    await this.database.transaction(async (tx) => {
      await tx.query(
        'DELETE FROM subtopic_access WHERE user_id = $1 AND NOT (subtopic_id = ANY($2::uuid[]))',
        [userId, subtopicIds],
      );
      if (subtopicIds.length > 0) {
        await tx.query(
          `INSERT INTO subtopic_access (user_id, subtopic_id, granted_by)
           SELECT $1, s.id, $3 FROM subtopics s WHERE s.id = ANY($2::uuid[])
           ON CONFLICT (user_id, subtopic_id) DO UPDATE SET expires_at = NULL`,
          [userId, subtopicIds, grantedBy],
        );
      }
    });
  }
}

function toSubject(row: SubjectRow): AdminSubject {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    status: row.status,
    sortOrder: row.sort_order,
    topicCount: Number(row.topic_count),
  };
}
