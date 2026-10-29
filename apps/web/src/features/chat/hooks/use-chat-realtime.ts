'use client';

import type { ChatConversation, ChatMessage } from '@formula/shared';
import { useQueryClient } from '@tanstack/react-query';
import { useEffect, useRef, useState } from 'react';

import {
  useRealtimeConnected,
  useRealtimeEvent,
} from '@/features/realtime/hooks/use-realtime-event';

import type { ThreadData, ThreadScope } from '../types';
import { findConversation, upsertConversation } from '../utils/conversation-cache';
import { appendMessage, markRead, setConversation } from '../utils/thread-cache';
import { chatKeys } from './chat-keys';

/** The stream must be down this long before the thread says it is reconnecting. */
const RECONNECT_NOTICE_MS = 5000;

/**
 * Applies the pushed events to the cached thread of `scope`: new messages (deduplicated, an
 * optimistic row of ours replaced), read receipts and status changes. After the stream was down
 * the thread is fetched again, so nothing pushed in the meantime is missed.
 */
export function useThreadRealtime(scope: ThreadScope): void {
  const queryClient = useQueryClient();
  const patch = (update: (data: ThreadData) => ThreadData) => {
    queryClient.setQueryData<ThreadData>(scope.queryKey, (current) =>
      current ? update(current) : current,
    );
  };

  useRealtimeEvent('chat.message', ({ message, conversation }) => {
    const current = queryClient.getQueryData<ThreadData>(scope.queryKey);
    if (!current) {
      void queryClient.invalidateQueries({ queryKey: scope.queryKey });
      return;
    }
    if (current.conversation.id !== message.conversationId) return;
    patch((data) => setConversation(appendMessage(data, message, scope.side), conversation));
  });

  useRealtimeEvent('chat.read', ({ conversationId, readerRole, readAt }) => {
    patch((data) => {
      if (data.conversation.id !== conversationId) return data;
      // The other side read ours; or this side (another tab, a colleague) read theirs.
      const role = readerRole === scope.side ? otherRole(scope) : scope.side;
      return markRead(data, role, readAt);
    });
  });

  useRealtimeEvent('chat.conversation', ({ conversation }) => {
    patch((data) =>
      data.conversation.id === conversation.id ? setConversation(data, conversation) : data,
    );
  });

  const connected = useRealtimeConnected();
  const wasConnected = useRef(connected);
  useEffect(() => {
    if (connected && !wasConnected.current) {
      void queryClient.invalidateQueries({ queryKey: scope.queryKey });
    }
    wasConnected.current = connected;
  }, [connected, queryClient, scope.queryKey]);
}

const otherRole = (scope: ThreadScope) => (scope.side === 'student' ? 'support' : 'student');

/** How the unread badge of a row changes with a pushed message. */
function unreadAfter(
  message: ChatMessage,
  pushed: ChatConversation,
  previous: ChatConversation | undefined,
): number {
  // A student message is unread for the team until an admin opens the thread. The pushed copy
  // may already count it; if it does not, count it here.
  if (message.senderRole === 'student') {
    return Math.max(pushed.unreadCount, (previous?.unreadCount ?? 0) + 1);
  }
  // A reply from the team does not change how many student messages wait.
  return previous?.unreadCount ?? pushed.unreadCount;
}

/**
 * Keeps the admin inbox list live: a new message moves its conversation to the top with an
 * unread badge, a status change moves it between "open" and "closed". The lists are re-fetched
 * in the background as well, so the server order always wins in the end.
 */
export function useInboxRealtime(): void {
  const queryClient = useQueryClient();
  const refresh = () => void queryClient.invalidateQueries({ queryKey: chatKeys.conversations });

  useRealtimeEvent('chat.message', ({ message, conversation }) => {
    const previous = findConversation(queryClient, conversation.id);
    upsertConversation(
      queryClient,
      { ...conversation, unreadCount: unreadAfter(message, conversation, previous) },
      true,
    );
    refresh();
  });

  useRealtimeEvent('chat.conversation', ({ conversation }) => {
    const previous = findConversation(queryClient, conversation.id);
    upsertConversation(
      queryClient,
      { ...conversation, unreadCount: previous?.unreadCount ?? conversation.unreadCount },
      false,
    );
    refresh();
  });

  useRealtimeEvent('chat.read', ({ conversationId, readerRole }) => {
    // Someone from the team (this tab or another) read the student's messages.
    if (readerRole !== 'support') return;
    upsertRead(queryClient, conversationId);
  });

  const connected = useRealtimeConnected();
  const wasConnected = useRef(connected);
  useEffect(() => {
    if (connected && !wasConnected.current) refresh();
    wasConnected.current = connected;
    // `refresh` only depends on the stable query client.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [connected]);
}

function upsertRead(queryClient: ReturnType<typeof useQueryClient>, conversationId: string) {
  const previous = findConversation(queryClient, conversationId);
  if (previous && previous.unreadCount !== 0) {
    upsertConversation(queryClient, { ...previous, unreadCount: 0 }, false);
  }
}

/**
 * True once the live stream has been down for a few seconds (short gaps during reconnects are
 * normal and not worth a banner).
 */
export function useReconnecting(): boolean {
  const connected = useRealtimeConnected();
  const [timedOut, setTimedOut] = useState(false);

  useEffect(() => {
    if (connected) return;
    const timer = window.setTimeout(() => setTimedOut(true), RECONNECT_NOTICE_MS);
    return () => {
      window.clearTimeout(timer);
      setTimedOut(false);
    };
  }, [connected]);

  return !connected && timedOut;
}
