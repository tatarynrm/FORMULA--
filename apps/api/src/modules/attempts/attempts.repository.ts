import type { AttemptStatus, TestCollection, TestKind } from '@formula/shared';
import { Injectable } from '@nestjs/common';

import { DatabaseService, type Queryable } from '../database/database.service.js';

export interface AttemptRecord {
  id: string;
  userId: string;
  testId: string;
  status: AttemptStatus;
  timed: boolean;
  timeLimitSeconds: number | null;
  explanationsEnabled: boolean;
  startedAt: Date;
  finishedAt: Date | null;
  reviewedAt: Date | null;
  score: number | null;
  maxScore: number | null;
  correctCount: number | null;
  totalCount: number | null;
  testTitle: string;
  testKind: TestKind;
  testCollection: TestCollection;
  testSubtopicId: string | null;
  testSubtopicTitle: string | null;
  testTopicTitle: string | null;
  testSubjectTitle: string | null;
}

export interface FullOption {
  id: string;
  position: number;
  body: string;
  imageFileId: string | null;
  explanation: string | null;
  isCorrect: boolean;
}

export interface FullQuestion {
  id: string;
  position: number;
  body: string;
  imageFileId: string | null;
  explanation: string | null;
  maxScore: number;
  options: FullOption[];
}

export interface AnswerRecord {
  questionId: string;
  optionIds: string[];
  textAnswer: string | null;
  isCorrect: boolean | null;
  score: number | null;
  reviewerComment: string | null;
}

export interface ReviewRow {
  attemptId: string;
  studentName: string;
  studentEmail: string;
  testTitle: string;
  subtopicTitle: string | null;
  topicTitle: string | null;
  subjectTitle: string | null;
  finishedAt: Date;
  status: AttemptStatus;
}

interface AttemptRow {
  id: string;
  user_id: string;
  test_id: string;
  status: AttemptStatus;
  timed: boolean;
  time_limit_seconds: number | null;
  explanations_enabled: boolean;
  started_at: Date;
  finished_at: Date | null;
  reviewed_at: Date | null;
  score: string | null;
  max_score: string | null;
  correct_count: number | null;
  total_count: number | null;
  test_title: string;
  test_kind: TestKind;
  test_collection: TestCollection;
  test_subtopic_id: string | null;
  test_subtopic_title: string | null;
  test_topic_title: string | null;
  test_subject_title: string | null;
}

const ATTEMPT_SELECT = `
  SELECT a.*, t.title AS test_title, t.kind AS test_kind, t.collection AS test_collection,
         t.subtopic_id AS test_subtopic_id, s.title AS test_subtopic_title,
         tp.title AS test_topic_title, sj.title AS test_subject_title
  FROM attempts a
  JOIN tests t ON t.id = a.test_id
  LEFT JOIN subtopics s ON s.id = t.subtopic_id
  LEFT JOIN topics tp ON tp.id = s.topic_id
  LEFT JOIN subjects sj ON sj.id = tp.subject_id`;

function toAttempt(row: AttemptRow): AttemptRecord {
  return {
    id: row.id,
    userId: row.user_id,
    testId: row.test_id,
    status: row.status,
    timed: row.timed,
    timeLimitSeconds: row.time_limit_seconds,
    explanationsEnabled: row.explanations_enabled,
    startedAt: row.started_at,
    finishedAt: row.finished_at,
    reviewedAt: row.reviewed_at,
    score: row.score === null ? null : Number(row.score),
    maxScore: row.max_score === null ? null : Number(row.max_score),
    correctCount: row.correct_count,
    totalCount: row.total_count,
    testTitle: row.test_title,
    testKind: row.test_kind,
    testCollection: row.test_collection,
    testSubtopicId: row.test_subtopic_id,
    testSubtopicTitle: row.test_subtopic_title,
    testTopicTitle: row.test_topic_title,
    testSubjectTitle: row.test_subject_title,
  };
}

@Injectable()
export class AttemptsRepository {
  constructor(private readonly database: DatabaseService) {}

  async findById(id: string): Promise<AttemptRecord | null> {
    const row = await this.database.queryOne<AttemptRow>(`${ATTEMPT_SELECT} WHERE a.id = $1`, [id]);
    return row ? toAttempt(row) : null;
  }

  async findInProgress(userId: string, testId: string): Promise<AttemptRecord | null> {
    const row = await this.database.queryOne<AttemptRow>(
      `${ATTEMPT_SELECT} WHERE a.user_id = $1 AND a.test_id = $2 AND a.status = 'in_progress'
       ORDER BY a.started_at DESC LIMIT 1`,
      [userId, testId],
    );
    return row ? toAttempt(row) : null;
  }

  /** Every attempt of a user, newest first (the admin's view of a student). */
  async listByUser(userId: string, limit: number): Promise<AttemptRecord[]> {
    const rows = await this.database.query<AttemptRow>(
      `${ATTEMPT_SELECT} WHERE a.user_id = $1 ORDER BY a.started_at DESC LIMIT $2`,
      [userId, limit],
    );
    return rows.map(toAttempt);
  }

  async listByTest(userId: string, testId: string): Promise<AttemptRecord[]> {
    const rows = await this.database.query<AttemptRow>(
      `${ATTEMPT_SELECT} WHERE a.user_id = $1 AND a.test_id = $2 ORDER BY a.started_at DESC`,
      [userId, testId],
    );
    return rows.map(toAttempt);
  }

  async create(input: {
    userId: string;
    testId: string;
    timed: boolean;
    timeLimitSeconds: number | null;
    explanationsEnabled: boolean;
  }): Promise<string> {
    const row = await this.database.queryOne<{ id: string }>(
      `INSERT INTO attempts (user_id, test_id, timed, time_limit_seconds, explanations_enabled)
       VALUES ($1, $2, $3, $4, $5) RETURNING id`,
      [input.userId, input.testId, input.timed, input.timeLimitSeconds, input.explanationsEnabled],
    );
    if (!row) throw new Error('INSERT INTO attempts returned no row');
    return row.id;
  }

  /** Questions with their options, including the right answers. Never send this to a student as is. */
  async loadQuestions(testId: string, db: Queryable = this.database): Promise<FullQuestion[]> {
    const questions = await db.query<{
      id: string;
      position: number;
      body: string;
      image_file_id: string | null;
      explanation: string | null;
      max_score: number;
    }>('SELECT * FROM questions WHERE test_id = $1 ORDER BY position', [testId]);

    const options = await db.query<{
      id: string;
      question_id: string;
      position: number;
      body: string;
      image_file_id: string | null;
      explanation: string | null;
      is_correct: boolean;
    }>(
      `SELECT o.* FROM question_options o JOIN questions q ON q.id = o.question_id
       WHERE q.test_id = $1 ORDER BY o.position`,
      [testId],
    );

    return questions.map((question) => ({
      id: question.id,
      position: question.position,
      body: question.body,
      imageFileId: question.image_file_id,
      explanation: question.explanation,
      maxScore: question.max_score,
      options: options
        .filter((option) => option.question_id === question.id)
        .map((option) => ({
          id: option.id,
          position: option.position,
          body: option.body,
          imageFileId: option.image_file_id,
          explanation: option.explanation,
          isCorrect: option.is_correct,
        })),
    }));
  }

  async getAnswers(attemptId: string, db: Queryable = this.database): Promise<AnswerRecord[]> {
    const rows = await db.query<{
      question_id: string;
      selected_option_ids: string[];
      text_answer: string | null;
      is_correct: boolean | null;
      score: string | null;
      reviewer_comment: string | null;
    }>('SELECT * FROM attempt_answers WHERE attempt_id = $1', [attemptId]);

    return rows.map((row) => ({
      questionId: row.question_id,
      optionIds: row.selected_option_ids,
      textAnswer: row.text_answer,
      isCorrect: row.is_correct,
      score: row.score === null ? null : Number(row.score),
      reviewerComment: row.reviewer_comment,
    }));
  }

  async upsertAnswer(input: {
    attemptId: string;
    questionId: string;
    optionIds: string[];
    textAnswer: string | null;
    isCorrect: boolean | null;
  }): Promise<void> {
    await this.database.query(
      `INSERT INTO attempt_answers (attempt_id, question_id, selected_option_ids, text_answer, is_correct)
       VALUES ($1, $2, $3::uuid[], $4, $5)
       ON CONFLICT (attempt_id, question_id) DO UPDATE SET
         selected_option_ids = EXCLUDED.selected_option_ids,
         text_answer = EXCLUDED.text_answer,
         is_correct = EXCLUDED.is_correct,
         answered_at = now()`,
      [input.attemptId, input.questionId, input.optionIds, input.textAnswer, input.isCorrect],
    );
  }

  /**
   * Closes an attempt and stores its result. Returns false when the attempt was already closed,
   * so two simultaneous "finish" calls cannot both grade it.
   */
  async finish(input: {
    attemptId: string;
    status: 'completed' | 'pending_review';
    score: number | null;
    maxScore: number;
    correctCount: number | null;
    totalCount: number;
    answerGrades: { questionId: string; isCorrect: boolean; score: number }[];
  }): Promise<boolean> {
    return this.database.transaction(async (tx) => {
      const updated = await tx.query(
        `UPDATE attempts SET status = $2, finished_at = now(), score = $3, max_score = $4,
                correct_count = $5, total_count = $6
         WHERE id = $1 AND status = 'in_progress' RETURNING id`,
        [
          input.attemptId,
          input.status,
          input.score,
          input.maxScore,
          input.correctCount,
          input.totalCount,
        ],
      );
      if (updated.length === 0) return false;

      for (const grade of input.answerGrades) {
        await tx.query(
          'UPDATE attempt_answers SET is_correct = $3, score = $4 WHERE attempt_id = $1 AND question_id = $2',
          [input.attemptId, grade.questionId, grade.isCorrect, grade.score],
        );
      }
      return true;
    });
  }

  // ---- Reviews ----

  async listForReview(status: AttemptStatus): Promise<ReviewRow[]> {
    const rows = await this.database.query<{
      id: string;
      name: string;
      surname: string;
      email: string;
      title: string;
      subtopic_title: string | null;
      topic_title: string | null;
      subject_title: string | null;
      finished_at: Date;
      status: AttemptStatus;
    }>(
      `SELECT a.id, u.name, u.surname, u.email, t.title, a.finished_at, a.status,
              s.title AS subtopic_title, tp.title AS topic_title, sj.title AS subject_title
       FROM attempts a
       JOIN users u ON u.id = a.user_id
       JOIN tests t ON t.id = a.test_id
       LEFT JOIN subtopics s ON s.id = t.subtopic_id
       LEFT JOIN topics tp ON tp.id = s.topic_id
       LEFT JOIN subjects sj ON sj.id = tp.subject_id
       WHERE a.status = $1 AND a.finished_at IS NOT NULL
       ORDER BY a.finished_at`,
      [status],
    );
    return rows.map((row) => ({
      attemptId: row.id,
      studentName: `${row.name} ${row.surname}`.trim(),
      studentEmail: row.email,
      testTitle: row.title,
      subtopicTitle: row.subtopic_title,
      topicTitle: row.topic_title,
      subjectTitle: row.subject_title,
      finishedAt: row.finished_at,
      status: row.status,
    }));
  }

  async findStudent(userId: string): Promise<{ name: string; email: string } | null> {
    const row = await this.database.queryOne<{ name: string; surname: string; email: string }>(
      'SELECT name, surname, email FROM users WHERE id = $1',
      [userId],
    );
    return row ? { name: `${row.name} ${row.surname}`.trim(), email: row.email } : null;
  }

  /** Writes the grades and closes the review in one transaction. Returns false if it was not pending. */
  async applyReview(input: {
    attemptId: string;
    reviewerId: string;
    grades: { questionId: string; score: number; comment: string | null }[];
    totalScore: number;
  }): Promise<boolean> {
    return this.database.transaction(async (tx) => {
      const updated = await tx.query(
        `UPDATE attempts SET status = 'reviewed', reviewed_at = now(), reviewed_by = $2, score = $3
         WHERE id = $1 AND status = 'pending_review' RETURNING id`,
        [input.attemptId, input.reviewerId, input.totalScore],
      );
      if (updated.length === 0) return false;

      for (const grade of input.grades) {
        await tx.query(
          `INSERT INTO attempt_answers (attempt_id, question_id, score, reviewer_comment)
           VALUES ($1, $2, $3, $4)
           ON CONFLICT (attempt_id, question_id) DO UPDATE SET score = EXCLUDED.score,
             reviewer_comment = EXCLUDED.reviewer_comment`,
          [input.attemptId, grade.questionId, grade.score, grade.comment],
        );
      }
      return true;
    });
  }
}
