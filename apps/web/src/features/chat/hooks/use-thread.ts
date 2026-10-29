'use client';

import { useQuery, useQueryClient } from '@tanstack/react-query';

import type { ThreadData, ThreadScope } from '../types';
import { mergeThread } from '../utils/thread-cache';
import { retryOnServerError } from './chat-keys';
import { STUDENT_THREAD_SCOPE, useAdminThreadScope } from './thread-scope';

/**
 * The thread of a scope: the conversation and its latest messages. Live events keep the cache
 * current while the thread is on screen; a (re)mount asks the api again and merges the answer
 * with what was already loaded (older pages, messages still being sent).
 */
export function useThread(scope: ThreadScope) {
  const queryClient = useQueryClient();

  return useQuery({
    queryKey: scope.queryKey,
    queryFn: async () =>
      mergeThread(
        await scope.endpoints.thread(),
        queryClient.getQueryData<ThreadData>(scope.queryKey),
      ),
    staleTime: 0,
    refetchOnWindowFocus: false,
    retry: retryOnServerError,
  });
}

/** The student's own conversation with the support team. */
export function useStudentThread() {
  return useThread(STUDENT_THREAD_SCOPE);
}

/** An admin's view of one conversation. */
export function useConversationThread(conversationId: string) {
  return useThread(useAdminThreadScope(conversationId));
}
