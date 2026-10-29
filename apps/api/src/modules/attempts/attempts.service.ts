import {
  type AnswerFeedback,
  type AttemptResult,
  type AttemptSession,
  type AttemptStatus,
  type AttemptSummary,
  type AttemptTestInfo,
  ERROR_CODES,
  type ResultQuestion,
  type ReviewDetail,
  type ReviewListItem,
  type SaveAnswerResult,
  type SavedAnswer,
  type StudentAttemptItem,
  type StudentQuestion,
  TESTS,
} from '@formula/shared';
import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { NOTIFICATION_TEXTS } from '../notifications/notification-texts.js';
import { NotificationsService } from '../notifications/notifications.service.js';
import { TestsService } from '../tests/tests.service.js';
import {
  type AnswerRecord,
  type AttemptRecord,
  AttemptsRepository,
  type FullQuestion,
} from './attempts.repository.js';
import type { SaveAnswerDto, StartAttemptDto, SubmitReviewDto } from './dto/attempts.dto.js';

/** A little slack for network delay when the deadline is checked. */
const DEADLINE_GRACE_MS = 5_000;

const sameSet = (left: string[], right: string[]) =>
  left.length === right.length && left.every((value) => right.includes(value));

function toSummary(attempt: AttemptRecord): AttemptSummary {
  const graded = attempt.score !== null && attempt.maxScore !== null && attempt.maxScore > 0;
  return {
    id: attempt.id,
    testId: attempt.testId,
    status: attempt.status,
    startedAt: attempt.startedAt.toISOString(),
    finishedAt: attempt.finishedAt?.toISOString() ?? null,
    timed: attempt.timed,
    explanationsEnabled: attempt.explanationsEnabled,
    score: attempt.score,
    maxScore: attempt.maxScore,
    correctCount: attempt.correctCount,
    totalCount: attempt.totalCount,
    percent: graded ? Math.round(((attempt.score ?? 0) / (attempt.maxScore ?? 1)) * 100) : null,
  };
}

function testInfoOf(attempt: AttemptRecord): AttemptTestInfo {
  return {
    id: attempt.testId,
    title: attempt.testTitle,
    kind: attempt.testKind,
    collection: attempt.testCollection,
    subtopicId: attempt.testSubtopicId,
    subtopicTitle: attempt.testSubtopicTitle,
  };
}

function deadlineOf(attempt: AttemptRecord): Date | null {
  if (!attempt.timed || !attempt.timeLimitSeconds) return null;
  return new Date(attempt.startedAt.getTime() + attempt.timeLimitSeconds * 1000);
}

function feedbackFor(question: FullQuestion, selected: string[]): AnswerFeedback {
  const correctOptionIds = question.options
    .filter((option) => option.isCorrect)
    .map((option) => option.id);
  return {
    isCorrect: sameSet(correctOptionIds, selected),
    correctOptionIds,
    explanation: question.explanation,
    optionExplanations: Object.fromEntries(
      question.options
        .filter((option) => option.explanation)
        .map((option) => [option.id, option.explanation as string]),
    ),
  };
}

@Injectable()
export class AttemptsService {
  constructor(
    private readonly repository: AttemptsRepository,
    private readonly tests: TestsService,
    private readonly notifications: NotificationsService,
  ) {}

  // ---- Student ----

  /** Starts an attempt, or continues the unfinished one (an expired one is closed first). */
  async start(userId: string, testId: string, dto: StartAttemptDto): Promise<AttemptSession> {
    const test = await this.tests.getForStudent(userId, testId);

    const existing = await this.repository.findInProgress(userId, testId);
    if (existing) {
      const deadline = deadlineOf(existing);
      if (!deadline || deadline.getTime() + DEADLINE_GRACE_MS > Date.now()) {
        return this.buildSession(existing);
      }
      await this.closeAttempt(existing);
    }

    const attemptId = await this.repository.create({
      userId,
      testId,
      timed: dto.timed && test.timeLimitSeconds !== null,
      timeLimitSeconds: test.timeLimitSeconds,
      explanationsEnabled: dto.explanationsEnabled,
    });
    return this.buildSession(await this.requireAttempt(userId, attemptId));
  }

  async getSession(userId: string, attemptId: string): Promise<AttemptSession> {
    const attempt = await this.requireAttempt(userId, attemptId);
    if (attempt.status !== 'in_progress') {
      throw new ConflictException({
        code: ERROR_CODES.ATTEMPT_FINISHED,
        message: 'This attempt is already finished',
      });
    }
    await this.assertStillAllowed(userId, attempt);
    return this.buildSession(attempt);
  }

  async saveAnswer(
    userId: string,
    attemptId: string,
    questionId: string,
    dto: SaveAnswerDto,
  ): Promise<SaveAnswerResult> {
    const attempt = await this.requireAttempt(userId, attemptId);
    if (attempt.status !== 'in_progress') {
      throw new ConflictException({
        code: ERROR_CODES.ATTEMPT_FINISHED,
        message: 'This attempt is already finished',
      });
    }
    await this.assertStillAllowed(userId, attempt);

    const deadline = deadlineOf(attempt);
    if (deadline && deadline.getTime() + DEADLINE_GRACE_MS < Date.now()) {
      throw new ConflictException({ code: ERROR_CODES.TIME_OVER, message: 'Time is over' });
    }

    const questions = await this.repository.loadQuestions(attempt.testId);
    const question = questions.find((candidate) => candidate.id === questionId);
    if (!question) throw new NotFoundException('Question not found in this test');

    if (attempt.testKind === 'situational') {
      const text = dto.textAnswer?.trim() || null;
      await this.repository.upsertAnswer({
        attemptId,
        questionId,
        optionIds: [],
        textAnswer: text,
        isCorrect: null,
      });
      return { saved: true, feedback: null };
    }

    const optionIds = [...new Set(dto.optionIds ?? [])];
    const known = new Set(question.options.map((option) => option.id));
    if (optionIds.some((id) => !known.has(id))) {
      throw new BadRequestException('An option does not belong to this question');
    }

    const correctCount = question.options.filter((option) => option.isCorrect).length;
    if (correctCount <= 1 && optionIds.length > 1) {
      throw new BadRequestException('Only one option can be chosen for this question');
    }

    if (attempt.explanationsEnabled) {
      if (optionIds.length === 0) throw new BadRequestException('Choose an option');

      // With explanations on, the answer is final: the student sees the result at once.
      const previous = (await this.repository.getAnswers(attemptId)).find(
        (answer) => answer.questionId === questionId,
      );
      if (previous && previous.optionIds.length > 0) {
        throw new ConflictException({
          code: ERROR_CODES.ANSWER_FINAL,
          message: 'This answer is already final',
        });
      }
    }

    const feedback = feedbackFor(question, optionIds);
    await this.repository.upsertAnswer({
      attemptId,
      questionId,
      optionIds,
      textAnswer: null,
      isCorrect: optionIds.length > 0 ? feedback.isCorrect : null,
    });

    return { saved: true, feedback: attempt.explanationsEnabled ? feedback : null };
  }

  /** Grades a choice attempt at once; a situational one waits for an admin. Safe to call twice. */
  async finish(userId: string, attemptId: string): Promise<AttemptResult> {
    const attempt = await this.requireAttempt(userId, attemptId);
    if (attempt.status === 'in_progress') {
      await this.closeAttempt(attempt);
    }
    return this.getResult(userId, attemptId);
  }

  async getResult(userId: string, attemptId: string): Promise<AttemptResult> {
    const attempt = await this.requireAttempt(userId, attemptId);
    if (attempt.status === 'in_progress') {
      throw new ConflictException({
        code: ERROR_CODES.CONFLICT,
        message: 'This attempt is not finished yet',
      });
    }
    return this.buildResult(attempt, { forReviewer: false });
  }

  async history(userId: string, testId: string): Promise<AttemptSummary[]> {
    return (await this.repository.listByTest(userId, testId)).map(toSummary);
  }

  /** The attempts of one student for the admin panel (any collection, any status). */
  async listForAdmin(userId: string, limit: number): Promise<StudentAttemptItem[]> {
    const attempts = await this.repository.listByUser(userId, limit);
    return attempts.map((attempt) => {
      const summary = toSummary(attempt);
      return {
        id: attempt.id,
        status: attempt.status,
        startedAt: summary.startedAt,
        finishedAt: summary.finishedAt,
        score: summary.score,
        maxScore: summary.maxScore,
        percent: summary.percent,
        test: {
          id: attempt.testId,
          title: attempt.testTitle,
          kind: attempt.testKind,
          collection: attempt.testCollection,
          subtopicId: attempt.testSubtopicId,
          subtopicTitle: attempt.testSubtopicTitle,
          subjectTitle: attempt.testSubjectTitle,
        },
      };
    });
  }

  // ---- Reviews (admins) ----

  async listReviews(status: AttemptStatus): Promise<ReviewListItem[]> {
    const rows = await this.repository.listForReview(
      status === 'reviewed' ? 'reviewed' : 'pending_review',
    );
    return rows.map((row) => ({ ...row, finishedAt: row.finishedAt.toISOString() }));
  }

  async getReview(attemptId: string): Promise<ReviewDetail> {
    const attempt = await this.repository.findById(attemptId);
    if (!attempt || (attempt.status !== 'pending_review' && attempt.status !== 'reviewed')) {
      throw new NotFoundException('Nothing to review');
    }
    const student = await this.repository.findStudent(attempt.userId);
    return {
      ...(await this.buildResult(attempt, { forReviewer: true })),
      studentName: student?.name ?? '',
      studentEmail: student?.email ?? '',
      subtopicTitle: attempt.testSubtopicTitle,
      topicTitle: attempt.testTopicTitle,
      subjectTitle: attempt.testSubjectTitle,
    };
  }

  async submitReview(
    reviewerId: string,
    attemptId: string,
    dto: SubmitReviewDto,
  ): Promise<ReviewDetail> {
    const attempt = await this.repository.findById(attemptId);
    if (!attempt || attempt.status !== 'pending_review') {
      throw new ConflictException({
        code: ERROR_CODES.CONFLICT,
        message: 'This attempt is not waiting for a review',
      });
    }

    const questions = await this.repository.loadQuestions(attempt.testId);
    const gradeByQuestion = new Map(dto.grades.map((grade) => [grade.questionId, grade]));

    for (const question of questions) {
      const grade = gradeByQuestion.get(question.id);
      if (!grade) throw new BadRequestException(`Question ${question.position} has no grade`);
      if (grade.score > question.maxScore) {
        throw new BadRequestException(
          `Question ${question.position}: the score is above ${question.maxScore}`,
        );
      }
    }
    if (
      dto.grades.some((grade) => !questions.some((question) => question.id === grade.questionId))
    ) {
      throw new BadRequestException('A grade refers to a question outside this test');
    }

    const grades = questions.map((question) => {
      const grade = gradeByQuestion.get(question.id);
      return {
        questionId: question.id,
        score: grade?.score ?? 0,
        comment: grade?.comment?.trim() || null,
      };
    });

    const totalScore = grades.reduce((sum, grade) => sum + grade.score, 0);
    const applied = await this.repository.applyReview({
      attemptId,
      reviewerId,
      grades,
      totalScore,
    });
    if (!applied) {
      throw new ConflictException({
        code: ERROR_CODES.CONFLICT,
        message: 'This attempt was already reviewed',
      });
    }

    await this.notifications.notify(attempt.userId, {
      type: 'review_done',
      ...NOTIFICATION_TEXTS.reviewDone(attempt.testTitle, totalScore, attempt.maxScore ?? 0),
      link: `/cabinet/attempts/${attemptId}/result`,
      data: { attemptId, testId: attempt.testId },
    });
    return this.getReview(attemptId);
  }

  // ---- helpers ----

  private async requireAttempt(userId: string, attemptId: string): Promise<AttemptRecord> {
    const attempt = await this.repository.findById(attemptId);
    // Someone else's attempt looks the same as a missing one.
    if (!attempt || attempt.userId !== userId) throw new NotFoundException('Attempt not found');
    return attempt;
  }

  /**
   * A subtopic test can be continued only while the student still has access to its subtopic: when an
   * admin withdraws it, the open attempt freezes (and continues from the same place if access returns).
   */
  private async assertStillAllowed(userId: string, attempt: AttemptRecord): Promise<void> {
    if (attempt.testCollection !== 'subtopic' || !attempt.testSubtopicId) return;
    if (await this.tests.canTakeSubtopicTests(userId, attempt.testSubtopicId)) return;
    throw new ForbiddenException({
      code: ERROR_CODES.FORBIDDEN,
      message: 'Access to this subtopic has been withdrawn',
    });
  }

  private async buildSession(attempt: AttemptRecord): Promise<AttemptSession> {
    const [questions, answers] = await Promise.all([
      this.repository.loadQuestions(attempt.testId),
      this.repository.getAnswers(attempt.id),
    ]);

    const studentQuestions: StudentQuestion[] = questions.map((question) => ({
      id: question.id,
      position: question.position,
      body: question.body,
      imageFileId: question.imageFileId,
      multiple: question.options.filter((option) => option.isCorrect).length > 1,
      options: question.options.map((option) => ({
        id: option.id,
        letter: TESTS.LETTERS[option.position - 1] ?? '?',
        body: option.body,
        imageFileId: option.imageFileId,
      })),
    }));

    const savedAnswers: SavedAnswer[] = answers.map((answer) => {
      const question = questions.find((candidate) => candidate.id === answer.questionId);
      return {
        questionId: answer.questionId,
        optionIds: answer.optionIds,
        textAnswer: answer.textAnswer,
        feedback:
          attempt.explanationsEnabled && question && answer.optionIds.length > 0
            ? feedbackFor(question, answer.optionIds)
            : null,
      };
    });

    return {
      attempt: toSummary(attempt),
      test: testInfoOf(attempt),
      deadlineAt: deadlineOf(attempt)?.toISOString() ?? null,
      serverNow: new Date().toISOString(),
      questions: studentQuestions,
      answers: savedAnswers,
    };
  }

  /** Grades what was answered. Anything left blank counts as wrong (choice) or 0 points (situational). */
  private async closeAttempt(attempt: AttemptRecord): Promise<void> {
    const [questions, answers] = await Promise.all([
      this.repository.loadQuestions(attempt.testId),
      this.repository.getAnswers(attempt.id),
    ]);

    if (attempt.testKind === 'situational') {
      await this.repository.finish({
        attemptId: attempt.id,
        status: 'pending_review',
        score: null,
        maxScore: questions.reduce((sum, question) => sum + question.maxScore, 0),
        correctCount: null,
        totalCount: questions.length,
        answerGrades: [],
      });
      // The reviewers' bell: one entry per work waiting for them.
      const student = await this.repository.findStudent(attempt.userId);
      await this.notifications.notifySection('reviews', {
        type: 'review_pending',
        ...NOTIFICATION_TEXTS.reviewPending(
          student?.name ?? '',
          attempt.testTitle,
          attempt.testSubjectTitle,
        ),
        link: `/admin/reviews/${attempt.id}`,
        data: { attemptId: attempt.id, studentId: attempt.userId },
      });
      return;
    }

    const answerGrades = questions.flatMap((question) => {
      const answer = answers.find((candidate) => candidate.questionId === question.id);
      if (!answer || answer.optionIds.length === 0) return [];
      const isCorrect = feedbackFor(question, answer.optionIds).isCorrect;
      return [{ questionId: question.id, isCorrect, score: isCorrect ? 1 : 0 }];
    });
    const correctCount = answerGrades.filter((grade) => grade.isCorrect).length;

    await this.repository.finish({
      attemptId: attempt.id,
      status: 'completed',
      score: correctCount,
      maxScore: questions.length,
      correctCount,
      totalCount: questions.length,
      answerGrades,
    });
  }

  private async buildResult(
    attempt: AttemptRecord,
    options: { forReviewer: boolean },
  ): Promise<AttemptResult> {
    const [questions, answers] = await Promise.all([
      this.repository.loadQuestions(attempt.testId),
      this.repository.getAnswers(attempt.id),
    ]);
    const answerOf = (questionId: string): AnswerRecord | undefined =>
      answers.find((answer) => answer.questionId === questionId);

    const reviewed = attempt.status === 'reviewed';
    const situational = attempt.testKind === 'situational';

    const resultQuestions: ResultQuestion[] = questions.map((question) => {
      const answer = answerOf(question.id);
      const selected = answer?.optionIds ?? [];
      // A situational answer key and grades appear to the student only once the review is done.
      const revealModel = !situational || reviewed || options.forReviewer;

      return {
        id: question.id,
        position: question.position,
        body: question.body,
        imageFileId: question.imageFileId,
        explanation: revealModel ? question.explanation : null,
        answered: Boolean(answer && (answer.optionIds.length > 0 || answer.textAnswer)),
        isCorrect: situational ? null : (answer?.isCorrect ?? false),
        options: question.options.map((option) => ({
          id: option.id,
          letter: TESTS.LETTERS[option.position - 1] ?? '?',
          body: option.body,
          imageFileId: option.imageFileId,
          isCorrect: option.isCorrect,
          explanation: option.explanation,
          selected: selected.includes(option.id),
        })),
        textAnswer: answer?.textAnswer ?? null,
        score: situational && (reviewed || options.forReviewer) ? (answer?.score ?? null) : null,
        maxScore: question.maxScore,
        reviewerComment: reviewed || options.forReviewer ? (answer?.reviewerComment ?? null) : null,
      };
    });

    return {
      attempt: toSummary(attempt),
      test: testInfoOf(attempt),
      questions: resultQuestions,
    };
  }
}
