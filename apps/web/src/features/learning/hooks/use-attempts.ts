'use client';

import type { AttemptResult } from '@formula/shared';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { type StartAttemptInput, attemptsApi } from '../api/attempts-api';
import { learningKeys, retryOnServerError } from './query-keys';

/**
 * The unfinished attempt with its questions and saved answers. It is read fresh on every visit and
 * dropped when the screen closes, because the runner builds its local state from this snapshot and a
 * cached older one would hide answers saved since.
 */
export function useAttemptSession(attemptId: string) {
  return useQuery({
    queryKey: learningKeys.attempt(attemptId),
    queryFn: () => attemptsApi.session(attemptId),
    staleTime: 0,
    gcTime: 0,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    retry: retryOnServerError,
  });
}

/** Result of a finished attempt. Re-read on every visit: a situational one changes once it is reviewed. */
export function useAttemptResult(attemptId: string) {
  return useQuery({
    queryKey: learningKeys.result(attemptId),
    queryFn: () => attemptsApi.result(attemptId),
    staleTime: 0,
    retry: retryOnServerError,
  });
}

/** Everything that shows a test's state (lists, history, home numbers) must be re-read after attempts change. */
function useRefreshTestState() {
  const queryClient = useQueryClient();

  return (testId: string) =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: learningKeys.testLists }),
      queryClient.invalidateQueries({ queryKey: learningKeys.test(testId) }),
      queryClient.invalidateQueries({ queryKey: learningKeys.history(testId) }),
      queryClient.invalidateQueries({ queryKey: learningKeys.progress }),
    ]);
}

/** Starts a test, or returns the unfinished attempt of that test (the chosen options are then ignored). */
export function useStartAttempt() {
  const refresh = useRefreshTestState();

  return useMutation({
    mutationFn: ({ testId, ...input }: StartAttemptInput & { testId: string }) =>
      attemptsApi.start(testId, input),
    onSuccess: (session) => refresh(session.test.id),
  });
}

/**
 * Closes the attempt and keeps its result in the cache, so the result page opens without a request.
 * The unfinished-attempt query is left alone: it is dropped when the runner closes, and re-reading it
 * now would only get "already finished" and navigate away before the runner is done.
 */
export function useFinishAttempt() {
  const queryClient = useQueryClient();
  const refresh = useRefreshTestState();

  return useMutation({
    mutationFn: (attemptId: string) => attemptsApi.finish(attemptId),
    onSuccess: (result: AttemptResult) => {
      queryClient.setQueryData(learningKeys.result(result.attempt.id), result);
      return refresh(result.test.id);
    },
  });
}
