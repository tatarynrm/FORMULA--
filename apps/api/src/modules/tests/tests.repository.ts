import { randomUUID } from 'node:crypto';

import {
  type AdminOption,
  type AdminQuestion,
  type AttemptStatus,
  type ContentStatus,
  type QuestionInput,
  type StudentTestSummary,
  type TestCollection,
  type TestFilterOptions,
  type TestKind,
  type TestSummary,
  TESTS,
} from '@formula/shared';
import { Injectable } from '@nestjs/common';

import { DatabaseService } from '../database/database.service.js';

interface TestRow {
  id: string;
  kind: TestKind;
  collection: TestCollection;
  subtopic_id: string | null;
  title: string;
  description: string | null;
  category: string | null;
  year: number | null;
  specialty: string | null;
  status: ContentStatus;
  time_limit_seconds: number | null;
  sort_order: number;
  updated_at: Date;
  question_count: string;
}

interface QuestionRow {
  id: string;
  position: number;
  body: string;
  image_file_id: string | null;
  explanation: string | null;
  max_score: number;
}

interface OptionRow {
  id: string;
  question_id: string;
  position: number;
  body: string;
  image_file_id: string | null;
  explanation: string | null;
  is_correct: boolean;
}

interface StudentTestRow {
  id: string;
  kind: TestKind;
  collection: TestCollection;
  subtopic_id: string | null;
  subtopic_title: string | null;
  title: string;
  description: string | null;
  category: string | null;
  year: number | null;
  specialty: string | null;
  time_limit_seconds: number | null;
  question_count: string;
  is_favorite: boolean;
  attempt_count: string;
  best_percent: string | null;
  last_id: string | null;
  last_status: AttemptStatus | null;
  last_started_at: Date | null;
  last_finished_at: Date | null;
  last_timed: boolean | null;
  last_explanations: boolean | null;
  last_score: string | null;
  last_max_score: string | null;
  last_correct: number | null;
  last_total: number | null;
}

export interface TestInsert {
  kind: TestKind;
  collection: TestCollection;
  subtopicId: string | null;
  title: string;
  description: string | null;
  category: string | null;
  year: number | null;
  specialty: string | null;
  timeLimitSeconds: number | null;
  createdBy: string;
}

export interface TestPatch {
  kind?: TestKind;
  title?: string;
  description?: string | null;
  category?: string | null;
  year?: number | null;
  specialty?: string | null;
  status?: ContentStatus;
  timeLimitSeconds?: number | null;
}

export interface StudentTestFilter {
  userId: string;
  isAdmin: boolean;
  collection?: TestCollection;
  subtopicId?: string;
  category?: string;
  year?: number;
  specialty?: string;
  query?: string;
  onlyFavorites?: boolean;
  testId?: string;
}

function toSummary(row: TestRow): TestSummary {
  return {
    id: row.id,
    kind: row.kind,
    collection: row.collection,
    subtopicId: row.subtopic_id,
    title: row.title,
    description: row.description,
    category: row.category,
    year: row.year,
    specialty: row.specialty,
    status: row.status,
    timeLimitSeconds: row.time_limit_seconds,
    questionCount: Number(row.question_count),
    sortOrder: row.sort_order,
    updatedAt: row.updated_at.toISOString(),
  };
}

const TEST_SELECT = `
  SELECT t.*, (SELECT count(*) FROM questions q WHERE q.test_id = t.id) AS question_count
  FROM tests t`;

/**
 * A student sees a subtopic test only when the whole chain is published and the subtopic is free
 * or granted. `$2` is the user id, `$3` marks admins (who may open everything).
 */
const ACCESSIBLE = `
  (t.collection <> 'subtopic' OR $3::boolean OR EXISTS (
     SELECT 1 FROM subtopics s
     JOIN topics tp ON tp.id = s.topic_id AND tp.status = 'published'
     JOIN subjects sj ON sj.id = tp.subject_id AND sj.status = 'published'
     WHERE s.id = t.subtopic_id AND s.status = 'published'
       AND has_subtopic_access($2, s.id)
  ))`;

@Injectable()
export class TestsRepository {
  constructor(private readonly database: DatabaseService) {}

  // ---- Admin ----

  async list(filter: { collection?: TestCollection; subtopicId?: string }): Promise<TestSummary[]> {
    const rows = await this.database.query<TestRow>(
      `${TEST_SELECT}
       WHERE ($1::text IS NULL OR t.collection = $1) AND ($2::uuid IS NULL OR t.subtopic_id = $2)
       ORDER BY t.sort_order, t.created_at`,
      [filter.collection ?? null, filter.subtopicId ?? null],
    );
    return rows.map(toSummary);
  }

  async findById(id: string): Promise<TestSummary | null> {
    const row = await this.database.queryOne<TestRow>(`${TEST_SELECT} WHERE t.id = $1`, [id]);
    return row ? toSummary(row) : null;
  }

  async create(input: TestInsert): Promise<string | null> {
    const row = await this.database.queryOne<{ id: string }>(
      `INSERT INTO tests (kind, collection, subtopic_id, title, description, category, year, specialty,
                          time_limit_seconds, created_by, sort_order)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10,
         COALESCE((SELECT max(sort_order) FROM tests WHERE collection = $2 AND subtopic_id IS NOT DISTINCT FROM $3), 0) + 10)
       RETURNING id`,
      [
        input.kind,
        input.collection,
        input.subtopicId,
        input.title,
        input.description,
        input.category,
        input.year,
        input.specialty,
        input.timeLimitSeconds,
        input.createdBy,
      ],
    );
    return row?.id ?? null;
  }

  async update(id: string, patch: TestPatch): Promise<boolean> {
    // Nullable fields use a "was it sent" flag so an explicit null clears the value.
    const rows = await this.database.query(
      `UPDATE tests SET
         kind = COALESCE($14, kind),
         title = COALESCE($2, title),
         description = CASE WHEN $3::boolean THEN $4 ELSE description END,
         category = CASE WHEN $5::boolean THEN $6 ELSE category END,
         year = CASE WHEN $7::boolean THEN $8 ELSE year END,
         specialty = CASE WHEN $9::boolean THEN $10 ELSE specialty END,
         status = COALESCE($11, status),
         time_limit_seconds = CASE WHEN $12::boolean THEN $13 ELSE time_limit_seconds END
       WHERE id = $1 RETURNING id`,
      [
        id,
        patch.title ?? null,
        patch.description !== undefined,
        patch.description ?? null,
        patch.category !== undefined,
        patch.category ?? null,
        patch.year !== undefined,
        patch.year ?? null,
        patch.specialty !== undefined,
        patch.specialty ?? null,
        patch.status ?? null,
        patch.timeLimitSeconds !== undefined,
        patch.timeLimitSeconds ?? null,
        patch.kind ?? null,
      ],
    );
    return rows.length > 0;
  }

  async delete(id: string): Promise<boolean> {
    return (
      (await this.database.query('DELETE FROM tests WHERE id = $1 RETURNING id', [id])).length > 0
    );
  }

  async findQuestions(testId: string): Promise<AdminQuestion[]> {
    const [questions, options] = await Promise.all([
      this.database.query<QuestionRow>(
        'SELECT * FROM questions WHERE test_id = $1 ORDER BY position',
        [testId],
      ),
      this.database.query<OptionRow>(
        `SELECT o.* FROM question_options o JOIN questions q ON q.id = o.question_id
         WHERE q.test_id = $1 ORDER BY o.position`,
        [testId],
      ),
    ]);

    return questions.map((question) => ({
      id: question.id,
      position: question.position,
      body: question.body,
      imageFileId: question.image_file_id,
      explanation: question.explanation,
      maxScore: question.max_score,
      options: options
        .filter((option) => option.question_id === question.id)
        .map((option): AdminOption => ({
          id: option.id,
          letter: TESTS.LETTERS[option.position - 1] ?? '?',
          body: option.body,
          imageFileId: option.image_file_id,
          explanation: option.explanation,
          isCorrect: option.is_correct,
        })),
    }));
  }

  /** Ids of the given files that really are uploaded images. */
  async findImageIds(ids: string[]): Promise<Set<string>> {
    if (ids.length === 0) return new Set();
    const rows = await this.database.query<{ id: string }>(
      "SELECT id FROM files WHERE id = ANY($1::uuid[]) AND purpose = 'image'",
      [ids],
    );
    return new Set(rows.map((row) => row.id));
  }

  /**
   * Makes the stored questions equal to `questions`, in this order. Questions and options that keep
   * their id are updated in place (so attempt history survives); missing ones are deleted.
   * Throws when an id belongs to another test (the service checks this first).
   */
  async replaceQuestions(
    testId: string,
    questions: QuestionInput[],
    isChoice: boolean,
  ): Promise<void> {
    await this.database.transaction(async (tx) => {
      const existing = await tx.query<{ id: string }>(
        'SELECT id FROM questions WHERE test_id = $1',
        [testId],
      );
      const keepIds = questions
        .map((question) => question.id)
        .filter((id): id is string => Boolean(id));

      await tx.query('DELETE FROM questions WHERE test_id = $1 AND NOT (id = ANY($2::uuid[]))', [
        testId,
        keepIds,
      ]);

      const existingIds = new Set(existing.map((row) => row.id));

      for (const [index, question] of questions.entries()) {
        const questionId = question.id && existingIds.has(question.id) ? question.id : randomUUID();

        await tx.query(
          `INSERT INTO questions (id, test_id, position, body, image_file_id, explanation, max_score)
           VALUES ($1, $2, $3, $4, $5, $6, $7)
           ON CONFLICT (id) DO UPDATE SET
             position = EXCLUDED.position, body = EXCLUDED.body, image_file_id = EXCLUDED.image_file_id,
             explanation = EXCLUDED.explanation, max_score = EXCLUDED.max_score`,
          [
            questionId,
            testId,
            index + 1,
            question.body,
            question.imageFileId ?? null,
            question.explanation ?? null,
            question.maxScore ?? 1,
          ],
        );

        const options = isChoice ? (question.options ?? []) : [];
        const keepOptionIds = options
          .map((option) => option.id)
          .filter((id): id is string => Boolean(id));
        await tx.query(
          'DELETE FROM question_options WHERE question_id = $1 AND NOT (id = ANY($2::uuid[]))',
          [questionId, keepOptionIds],
        );

        const ownOptions = await tx.query<{ id: string }>(
          'SELECT id FROM question_options WHERE question_id = $1',
          [questionId],
        );
        const ownOptionIds = new Set(ownOptions.map((row) => row.id));

        for (const [optionIndex, option] of options.entries()) {
          await tx.query(
            `INSERT INTO question_options (id, question_id, position, body, image_file_id, explanation, is_correct)
             VALUES ($1, $2, $3, $4, $5, $6, $7)
             ON CONFLICT (id) DO UPDATE SET
               position = EXCLUDED.position, body = EXCLUDED.body, image_file_id = EXCLUDED.image_file_id,
               explanation = EXCLUDED.explanation, is_correct = EXCLUDED.is_correct`,
            [
              option.id && ownOptionIds.has(option.id) ? option.id : randomUUID(),
              questionId,
              optionIndex + 1,
              option.body,
              option.imageFileId ?? null,
              option.explanation ?? null,
              option.isCorrect,
            ],
          );
        }
      }

      await tx.query('UPDATE tests SET updated_at = now() WHERE id = $1', [testId]);
    });
  }

  /** Ids of the questions and options that belong to a test, to reject foreign ids early. */
  async findOwnedIds(testId: string): Promise<{ questions: Set<string>; options: Set<string> }> {
    const [questions, options] = await Promise.all([
      this.database.query<{ id: string }>('SELECT id FROM questions WHERE test_id = $1', [testId]),
      this.database.query<{ id: string }>(
        'SELECT o.id FROM question_options o JOIN questions q ON q.id = o.question_id WHERE q.test_id = $1',
        [testId],
      ),
    ]);
    return {
      questions: new Set(questions.map((row) => row.id)),
      options: new Set(options.map((row) => row.id)),
    };
  }

  // ---- Student ----

  async listForStudent(filter: StudentTestFilter): Promise<StudentTestSummary[]> {
    const rows = await this.database.query<StudentTestRow>(
      `SELECT t.id, t.kind, t.collection, t.title, t.description, t.category, t.year, t.specialty,
              t.time_limit_seconds, t.subtopic_id,
              (SELECT s.title FROM subtopics s WHERE s.id = t.subtopic_id) AS subtopic_title,
              (SELECT count(*) FROM questions q WHERE q.test_id = t.id) AS question_count,
              EXISTS (SELECT 1 FROM favorites f WHERE f.test_id = t.id AND f.user_id = $2) AS is_favorite,
              (SELECT count(*) FROM attempts a
                 WHERE a.test_id = t.id AND a.user_id = $2 AND a.status <> 'in_progress') AS attempt_count,
              (SELECT max(round(a.score / a.max_score * 100)) FROM attempts a
                 WHERE a.test_id = t.id AND a.user_id = $2 AND a.status IN ('completed', 'reviewed')
                   AND a.max_score > 0) AS best_percent,
              la.id AS last_id, la.status AS last_status, la.started_at AS last_started_at,
              la.finished_at AS last_finished_at, la.timed AS last_timed,
              la.explanations_enabled AS last_explanations, la.score AS last_score,
              la.max_score AS last_max_score, la.correct_count AS last_correct, la.total_count AS last_total
       FROM tests t
       LEFT JOIN LATERAL (
         SELECT * FROM attempts a WHERE a.test_id = t.id AND a.user_id = $2
         ORDER BY a.started_at DESC LIMIT 1
       ) la ON true
       WHERE t.status = 'published'
         AND ${ACCESSIBLE}
         AND ($1::text IS NULL OR t.collection = $1)
         AND ($4::uuid IS NULL OR t.subtopic_id = $4)
         AND ($5::text IS NULL OR t.category = $5)
         AND ($6::integer IS NULL OR t.year = $6)
         AND ($7::text IS NULL OR t.specialty = $7)
         AND ($8::text IS NULL OR t.title ILIKE '%' || $8 || '%')
         AND (NOT $9::boolean OR EXISTS (SELECT 1 FROM favorites f WHERE f.test_id = t.id AND f.user_id = $2))
         AND ($10::uuid IS NULL OR t.id = $10)
         AND (SELECT count(*) FROM questions q WHERE q.test_id = t.id) > 0
       ORDER BY t.sort_order, t.created_at`,
      [
        filter.collection ?? null,
        filter.userId,
        filter.isAdmin,
        filter.subtopicId ?? null,
        filter.category ?? null,
        filter.year ?? null,
        filter.specialty ?? null,
        filter.query ?? null,
        filter.onlyFavorites ?? false,
        filter.testId ?? null,
      ],
    );

    return rows.map((row) => ({
      id: row.id,
      kind: row.kind,
      collection: row.collection,
      subtopicId: row.subtopic_id,
      subtopicTitle: row.subtopic_title,
      title: row.title,
      description: row.description,
      category: row.category,
      year: row.year,
      specialty: row.specialty,
      timeLimitSeconds: row.time_limit_seconds,
      questionCount: Number(row.question_count),
      isFavorite: row.is_favorite,
      attemptCount: Number(row.attempt_count),
      bestPercent: row.best_percent === null ? null : Number(row.best_percent),
      lastAttempt: row.last_id
        ? {
            id: row.last_id,
            testId: row.id,
            status: row.last_status ?? 'in_progress',
            startedAt: (row.last_started_at ?? new Date()).toISOString(),
            finishedAt: row.last_finished_at?.toISOString() ?? null,
            timed: row.last_timed ?? false,
            explanationsEnabled: row.last_explanations ?? false,
            score: row.last_score === null ? null : Number(row.last_score),
            maxScore: row.last_max_score === null ? null : Number(row.last_max_score),
            correctCount: row.last_correct,
            totalCount: row.last_total,
            percent:
              row.last_score !== null && Number(row.last_max_score) > 0
                ? Math.round((Number(row.last_score) / Number(row.last_max_score)) * 100)
                : null,
          }
        : null,
    }));
  }

  /** A published test the user may open, or `null`. */
  async findForStudent(
    testId: string,
    userId: string,
    isAdmin: boolean,
  ): Promise<TestSummary | null> {
    const row = await this.database.queryOne<TestRow>(
      `SELECT t.*, (SELECT count(*) FROM questions q WHERE q.test_id = t.id) AS question_count
       FROM tests t
       WHERE t.id = $1 AND t.status = 'published' AND ${ACCESSIBLE}`,
      [testId, userId, isAdmin],
    );
    return row ? toSummary(row) : null;
  }

  async filterOptions(collection: TestCollection): Promise<TestFilterOptions> {
    const [categories, years, specialties] = await Promise.all([
      this.database.query<{ value: string }>(
        `SELECT DISTINCT category AS value FROM tests
         WHERE collection = $1 AND status = 'published' AND category IS NOT NULL ORDER BY 1`,
        [collection],
      ),
      this.database.query<{ value: number }>(
        `SELECT DISTINCT year AS value FROM tests
         WHERE collection = $1 AND status = 'published' AND year IS NOT NULL ORDER BY 1 DESC`,
        [collection],
      ),
      this.database.query<{ value: string }>(
        `SELECT DISTINCT specialty AS value FROM tests
         WHERE collection = $1 AND status = 'published' AND specialty IS NOT NULL ORDER BY 1`,
        [collection],
      ),
    ]);
    return {
      categories: categories.map((row) => row.value),
      years: years.map((row) => row.value),
      specialties: specialties.map((row) => row.value),
    };
  }

  // ---- Favorites ----

  async addFavorite(userId: string, testId: string): Promise<boolean> {
    const rows = await this.database.query(
      `INSERT INTO favorites (user_id, test_id)
       SELECT $1, id FROM tests WHERE id = $2
       ON CONFLICT DO NOTHING
       RETURNING test_id`,
      [userId, testId],
    );
    // `rows` is empty both for "already saved" and "no such test"; check the test separately.
    if (rows.length > 0) return true;
    return (
      (await this.database.queryOne('SELECT 1 AS ok FROM tests WHERE id = $1', [testId])) !== null
    );
  }

  async removeFavorite(userId: string, testId: string): Promise<void> {
    await this.database.query('DELETE FROM favorites WHERE user_id = $1 AND test_id = $2', [
      userId,
      testId,
    ]);
  }
}
