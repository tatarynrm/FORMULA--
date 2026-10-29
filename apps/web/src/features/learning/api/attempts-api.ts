import type {
  AttemptResult,
  AttemptSession,
  AttemptSummary,
  SaveAnswerResult,
} from '@formula/shared';

import { apiFetch } from '@/lib/api-client';

export interface StartAttemptInput {
  /** Accept the time limit the admin set (ignored by the api when the test has none). */
  timed: boolean;
  /** Show the feedback of every answer right after it was given. */
  explanationsEnabled: boolean;
}

/** Choice questions send `optionIds` (an empty list clears the answer), situational ones `textAnswer`. */
export interface SaveAnswerInput {
  optionIds?: string[];
  textAnswer?: string | null;
}

export const attemptsApi = {
  /** Starts a new attempt, or returns the unfinished one (then the input is ignored). */
  start: (testId: string, input: StartAttemptInput) =>
    apiFetch<AttemptSession>(`/tests/${testId}/attempts`, { method: 'POST', body: input }),
  history: (testId: string) => apiFetch<AttemptSummary[]>(`/tests/${testId}/attempts`),
  /** Answers 409 `ATTEMPT_FINISHED` when the attempt is already finished. */
  session: (attemptId: string) => apiFetch<AttemptSession>(`/attempts/${attemptId}`),
  /** Answers 409 with `ATTEMPT_FINISHED`, `TIME_OVER` or `ANSWER_FINAL` when the answer cannot be taken. */
  saveAnswer: (attemptId: string, questionId: string, input: SaveAnswerInput) =>
    apiFetch<SaveAnswerResult>(`/attempts/${attemptId}/answers/${questionId}`, {
      method: 'PUT',
      body: input,
    }),
  finish: (attemptId: string) =>
    apiFetch<AttemptResult>(`/attempts/${attemptId}/finish`, { method: 'POST' }),
  /** Answers 409 `CONFLICT` while the attempt is still in progress. */
  result: (attemptId: string) => apiFetch<AttemptResult>(`/attempts/${attemptId}/result`),
};
