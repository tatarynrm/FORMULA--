import {
  CHAT,
  type ChatConversation,
  type ChatConversationListQuery,
  type ChatMessage,
  type ChatMessagesPage,
  type ChatStatus,
  type ChatThread,
  type SendChatMessageInput,
} from '@formula/shared';

import { apiFetch, apiFetchPage } from '@/lib/api-client';

export interface ReadReceipt {
  readAt: string;
}

/**
 * The calls one thread needs. The student has a single thread (`/chat`), the admin one per
 * conversation (`/admin/chat/conversations/:id`); the thread UI and hooks work with either.
 */
export interface ThreadEndpoints {
  thread: () => Promise<ChatThread>;
  /** Messages older than the given one (the oldest on screen), oldest first. */
  older: (before: string, limit?: number) => Promise<ChatMessagesPage>;
  send: (input: SendChatMessageInput) => Promise<ChatMessage>;
  /** Marks the messages of the other side as read. */
  markRead: () => Promise<ReadReceipt>;
  typing: () => Promise<unknown>;
}

function threadEndpoints(base: string): ThreadEndpoints {
  return {
    thread: () => apiFetch<ChatThread>(base),
    older: (before, limit = CHAT.PAGE_SIZE) =>
      apiFetch<ChatMessagesPage>(
        `${base}/messages?before=${encodeURIComponent(before)}&limit=${limit}`,
      ),
    send: (input) => apiFetch<ChatMessage>(`${base}/messages`, { method: 'POST', body: input }),
    markRead: () => apiFetch<ReadReceipt>(`${base}/read`, { method: 'POST' }),
    typing: () => apiFetch<unknown>(`${base}/typing`, { method: 'POST' }),
  };
}

/** The student's own conversation with the support team (created on the first call). */
export const studentChatApi: ThreadEndpoints = threadEndpoints('/chat');

const ADMIN_BASE = '/admin/chat/conversations';

/** The api needs the `support` section: it answers 403 for everyone else. */
export const adminChatApi = {
  /** Sorted by last activity; `unreadCount` counts the unread student messages. */
  conversations: ({ status, q, page, limit }: ChatConversationListQuery) => {
    const params = new URLSearchParams();
    if (status) params.set('status', status);
    if (q) params.set('q', q);
    if (page) params.set('page', String(page));
    if (limit) params.set('limit', String(limit));
    return apiFetchPage<ChatConversation>(`${ADMIN_BASE}?${params.toString()}`);
  },
  thread: (conversationId: string): ThreadEndpoints =>
    threadEndpoints(`${ADMIN_BASE}/${conversationId}`),
  setStatus: (conversationId: string, status: ChatStatus) =>
    apiFetch<ChatConversation>(`${ADMIN_BASE}/${conversationId}`, {
      method: 'PATCH',
      body: { status },
    }),
};
