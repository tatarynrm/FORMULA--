'use client';

import { ERROR_CODES } from '@formula/shared';
import { useEffect, useState } from 'react';

import { attemptsApi } from '../api/attempts-api';
import { AnswerQueue, type SaveStatus } from '../utils/answer-queue';
import { hasErrorCode } from './query-keys';

export type { SaveStatus };

interface UseAnswerSaverOptions {
  attemptId: string;
  /** The api refused an answer because the attempt is closed (time is over, or it was finished elsewhere). */
  onClosed: () => void;
  /** The api refused an answer because the student lost access to the subtopic (`FORBIDDEN`). */
  onRefused: () => void;
}

/**
 * Autosave of answers that can change until the end (exam mode and written answers), see `AnswerQueue`.
 * `statuses` tells, per question, whether its last answer is being saved, saved or failed.
 */
export function useAnswerSaver({ attemptId, onClosed, onRefused }: UseAnswerSaverOptions) {
  const [statuses, setStatuses] = useState<Record<string, SaveStatus>>({});

  // One queue per mounted runner; the runner is keyed by its attempt, so `attemptId` never changes under it.
  const [queue] = useState(
    () =>
      new AnswerQueue({
        send: async (questionId, payload) => {
          await attemptsApi.saveAnswer(attemptId, questionId, payload);
        },
        onStatus: (questionId, status) =>
          setStatuses((previous) =>
            previous[questionId] === status ? previous : { ...previous, [questionId]: status },
          ),
        isClosedError: (error) =>
          hasErrorCode(error, ERROR_CODES.TIME_OVER, ERROR_CODES.ATTEMPT_FINISHED),
        isRefusedError: (error) => hasErrorCode(error, ERROR_CODES.FORBIDDEN),
      }),
  );

  // The handlers are replaced on every render, so they always see the latest state of the runner.
  useEffect(() => {
    queue.setClosedHandler(onClosed);
    queue.setRefusedHandler(onRefused);
  });

  // Leaving the screen must not lose the last words typed.
  useEffect(
    () => () => {
      void queue.flush();
    },
    [queue],
  );

  return { statuses, enqueue: queue.enqueue, flush: queue.flush, retry: queue.retry };
}
