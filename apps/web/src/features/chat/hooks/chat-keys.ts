import { ApiClientError } from '@/lib/api-client';

import type { ConversationListFilter } from '../types';

const ROOT = ['chat'] as const;

/** One place for every TanStack Query key of the chat, so live updates can find the right cache. */
export const chatKeys = {
  all: ROOT,
  /** The student's own thread. */
  studentThread: [...ROOT, 'student', 'thread'] as const,
  /** Prefix of every admin thread. */
  adminThreads: [...ROOT, 'admin', 'thread'] as const,
  adminThread: (conversationId: string) => [...ROOT, 'admin', 'thread', conversationId] as const,
  /** Prefix of every filter of the inbox list. */
  conversations: [...ROOT, 'admin', 'conversations'] as const,
  conversationList: (filter: ConversationListFilter) =>
    [...ROOT, 'admin', 'conversations', filter] as const,
};

/** A 4xx answer will not change by asking again; only network and server errors are worth a retry. */
export function retryOnServerError(failureCount: number, error: unknown): boolean {
  const clientError =
    error instanceof ApiClientError && error.statusCode >= 400 && error.statusCode < 500;
  return !clientError && failureCount < 1;
}
