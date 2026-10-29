'use client';

import { useMemo } from 'react';

import { adminChatApi, studentChatApi } from '../api/chat-api';
import type { ThreadScope } from '../types';
import { chatKeys } from './chat-keys';

/** The student's own conversation: one per account, so the scope never changes. */
export const STUDENT_THREAD_SCOPE: ThreadScope = {
  side: 'student',
  queryKey: chatKeys.studentThread,
  endpoints: studentChatApi,
};

/** An admin's view of one conversation. Stable for the same id, so effects do not re-run. */
export function useAdminThreadScope(conversationId: string): ThreadScope {
  return useMemo(
    () => ({
      side: 'support',
      queryKey: chatKeys.adminThread(conversationId),
      endpoints: adminChatApi.thread(conversationId),
    }),
    [conversationId],
  );
}
