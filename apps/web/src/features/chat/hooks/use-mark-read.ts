'use client';

import { useQueryClient } from '@tanstack/react-query';
import { useEffect, useRef } from 'react';

import { notificationKeys } from '@/features/notifications/hooks/query-keys';

import type { ThreadData, ThreadScope } from '../types';
import { patchConversation } from '../utils/conversation-cache';
import { markRead, unreadCount } from '../utils/thread-cache';

/** A short pause, so a burst of incoming messages is acknowledged with one request. */
const DEBOUNCE_MS = 400;

const otherSide = (scope: ThreadScope) => (scope.side === 'student' ? 'support' : 'student');

/**
 * Tells the api that the messages of the other side were read: when the thread is on screen,
 * the tab is visible and the window has focus, and there is something unread. Runs again when
 * the window gets focus or a new message arrives.
 */
export function useMarkRead(scope: ThreadScope, data: ThreadData | undefined): void {
  const queryClient = useQueryClient();
  const inFlight = useRef(false);
  const unread = data ? unreadCount(data, otherSide(scope)) : 0;
  // The id of the newest unread message: a new arrival re-arms the effect even when the count is equal
  // (one was read elsewhere while another came in).
  const newestUnreadId = data?.messages.findLast(
    (message) => message.senderRole === otherSide(scope) && message.readAt === null,
  )?.id;

  useEffect(() => {
    if (unread === 0) return;
    let timer: number | null = null;

    const acknowledge = async () => {
      if (inFlight.current) return;
      inFlight.current = true;
      try {
        const { readAt } = await scope.endpoints.markRead();
        const role = otherSide(scope);
        queryClient.setQueryData<ThreadData>(scope.queryKey, (current) =>
          current
            ? {
                ...markRead(current, role, readAt),
                conversation: { ...current.conversation, unreadCount: 0 },
              }
            : current,
        );
        const conversationId = queryClient.getQueryData<ThreadData>(scope.queryKey)?.conversation
          .id;
        if (conversationId) {
          patchConversation(queryClient, conversationId, (conversation) => ({
            ...conversation,
            unreadCount: 0,
          }));
        }
        // The counter in the menu next to «Підтримка» counts these messages.
        void queryClient.invalidateQueries({ queryKey: notificationKeys.summary });
      } catch {
        // Not acknowledged: the next focus or message tries again.
      } finally {
        inFlight.current = false;
      }
    };

    const attempt = () => {
      if (document.visibilityState !== 'visible' || !document.hasFocus()) return;
      if (timer !== null) window.clearTimeout(timer);
      timer = window.setTimeout(() => void acknowledge(), DEBOUNCE_MS);
    };

    attempt();
    window.addEventListener('focus', attempt);
    document.addEventListener('visibilitychange', attempt);
    return () => {
      window.removeEventListener('focus', attempt);
      document.removeEventListener('visibilitychange', attempt);
      if (timer !== null) window.clearTimeout(timer);
    };
  }, [unread, newestUnreadId, scope, queryClient]);
}
