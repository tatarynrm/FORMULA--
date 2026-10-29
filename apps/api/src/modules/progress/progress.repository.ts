import { Injectable } from '@nestjs/common';

import { DatabaseService } from '../database/database.service.js';

/** One subtopic of a published subject, as seen by one student. */
export interface SubtopicProgressRow {
  subjectId: string;
  subjectTitle: string;
  subjectDescription: string | null;
  topicCount: number;
  hasFullAccess: boolean;
  /** `null` for a subject that has no published subtopics yet. */
  subtopicId: string | null;
  hasAccess: boolean;
  /** Published tests with at least one question. */
  testCount: number;
  /** Of those, the ones the student finished at least once. */
  finishedTests: number;
}

export interface AttemptTotals {
  testsPassed: number;
  averagePercent: number | null;
  mistakes: number;
}

interface SubtopicRow {
  subject_id: string;
  subject_title: string;
  subject_description: string | null;
  topic_count: string;
  has_full_access: boolean;
  subtopic_id: string | null;
  has_access: boolean;
  test_count: string | null;
  finished_tests: string | null;
}

@Injectable()
export class ProgressRepository {
  constructor(private readonly database: DatabaseService) {}

  /**
   * Every published subtopic with the student's access and finished tests. `isAdmin` opens
   * everything, like the catalog does for previews.
   */
  async findSubtopicProgress(userId: string, isAdmin: boolean): Promise<SubtopicProgressRow[]> {
    const rows = await this.database.query<SubtopicRow>(
      `SELECT sj.id AS subject_id, sj.title AS subject_title, sj.description AS subject_description,
              (SELECT count(*) FROM topics x WHERE x.subject_id = sj.id AND x.status = 'published') AS topic_count,
              ($2::boolean OR EXISTS (
                 SELECT 1 FROM subject_access sa
                 WHERE sa.subject_id = sj.id AND sa.user_id = $1
                   AND (sa.expires_at IS NULL OR sa.expires_at > now())
              )) AS has_full_access,
              s.id AS subtopic_id,
              ($2::boolean OR has_subtopic_access($1, s.id)) AS has_access,
              (SELECT count(*) FROM tests t
                 WHERE t.subtopic_id = s.id AND t.status = 'published'
                   AND EXISTS (SELECT 1 FROM questions q WHERE q.test_id = t.id)) AS test_count,
              (SELECT count(*) FROM tests t
                 WHERE t.subtopic_id = s.id AND t.status = 'published'
                   AND EXISTS (SELECT 1 FROM questions q WHERE q.test_id = t.id)
                   AND EXISTS (SELECT 1 FROM attempts a
                               WHERE a.test_id = t.id AND a.user_id = $1 AND a.status <> 'in_progress')
              ) AS finished_tests
       FROM subjects sj
       LEFT JOIN topics tp ON tp.subject_id = sj.id AND tp.status = 'published'
       LEFT JOIN subtopics s ON s.topic_id = tp.id AND s.status = 'published'
       WHERE sj.status = 'published'
       ORDER BY sj.sort_order, sj.created_at, tp.sort_order, s.sort_order`,
      [userId, isAdmin],
    );

    return rows.map((row) => ({
      subjectId: row.subject_id,
      subjectTitle: row.subject_title,
      subjectDescription: row.subject_description,
      topicCount: Number(row.topic_count),
      hasFullAccess: row.has_full_access,
      subtopicId: row.subtopic_id,
      hasAccess: row.has_access ?? false,
      testCount: Number(row.test_count ?? 0),
      finishedTests: Number(row.finished_tests ?? 0),
    }));
  }

  async findAttemptTotals(userId: string): Promise<AttemptTotals> {
    const [passed, average, mistakes] = await Promise.all([
      this.database.queryOne<{ total: string }>(
        `SELECT count(DISTINCT test_id)::text AS total FROM attempts
         WHERE user_id = $1 AND status <> 'in_progress'`,
        [userId],
      ),
      // Best result of each graded test, averaged.
      this.database.queryOne<{ average: string | null }>(
        `SELECT avg(best)::text AS average FROM (
           SELECT max(score / max_score * 100) AS best
           FROM attempts
           WHERE user_id = $1 AND status IN ('completed', 'reviewed') AND max_score > 0
           GROUP BY test_id
         ) results`,
        [userId],
      ),
      // Wrong answers in the latest finished attempt of every choice test.
      this.database.queryOne<{ total: string }>(
        `SELECT COALESCE(sum(total_count - correct_count), 0)::text AS total FROM (
           SELECT DISTINCT ON (test_id) total_count, correct_count
           FROM attempts
           WHERE user_id = $1 AND status = 'completed'
           ORDER BY test_id, started_at DESC
         ) latest`,
        [userId],
      ),
    ]);

    return {
      testsPassed: Number(passed?.total ?? 0),
      averagePercent: average?.average ? Math.round(Number(average.average)) : null,
      mistakes: Number(mistakes?.total ?? 0),
    };
  }
}
