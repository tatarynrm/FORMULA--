import type { AttemptSummary, ResultQuestion, StudentTestSummary } from '@formula/shared';

import type { AnswerState } from '../types';

export type TestPhase = 'new' | 'in_progress' | 'finished';

export interface TestState {
  phase: TestPhase;
  /** The unfinished attempt to continue, if there is one. */
  openAttemptId: string | null;
  /** Newest finished attempt known from the summary. */
  lastFinished: AttemptSummary | null;
  /** The newest attempt is unfinished while older finished ones exist, so only the history knows the last result. */
  needsHistory: boolean;
}

/** What a student can do with a test, derived from the summary the api sends with every list. */
export function getTestState(test: StudentTestSummary): TestState {
  const last = test.lastAttempt;
  const open = last?.status === 'in_progress' ? last : null;
  const lastFinished = last && !open ? last : null;

  return {
    phase: open ? 'in_progress' : lastFinished ? 'finished' : 'new',
    openAttemptId: open?.id ?? null,
    lastFinished,
    needsHistory: open !== null && test.attemptCount > 0,
  };
}

/** Newest finished attempt of a history (the api lists it newest first). */
export function findLastFinished(
  history: readonly AttemptSummary[] | undefined,
): AttemptSummary | null {
  return history?.find((attempt) => attempt.status !== 'in_progress') ?? null;
}

/** Wrong answers of a graded choice attempt (blank answers count as wrong). `null` when not known. */
export function countMistakes(attempt: AttemptSummary | null): number | null {
  if (attempt?.status !== 'completed') return null;
  if (attempt.correctCount === null || attempt.totalCount === null) return null;
  return Math.max(0, attempt.totalCount - attempt.correctCount);
}

/** State of one question of a choice result. */
export function getChoiceState(question: ResultQuestion): AnswerState {
  if (!question.answered) return 'skipped';
  return question.isCorrect ? 'correct' : 'wrong';
}

/** State of one question of a situational result: waiting for the review, or graded by points. */
export function getSituationalState(question: ResultQuestion): AnswerState {
  if (!question.answered) return 'skipped';
  if (question.score === null) return 'pending';
  if (question.score >= question.maxScore) return 'correct';
  return question.score <= 0 ? 'wrong' : 'partial';
}
