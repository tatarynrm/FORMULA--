import type {
  ChatConversation,
  ChatMessage,
  ChatMessagesPage,
  ChatSenderRole,
  ChatThread,
} from '@formula/shared';

import type { SendState, StatusNotice, ThreadData, ThreadMessage } from '../types';

/** Pure updates of the cached thread. Every function returns a new object and never mutates. */

const time = (iso: string) => new Date(iso).getTime();

/** Oldest first; equal times keep their order (optimistic rows stay after what they followed). */
function sortMessages(messages: ThreadMessage[]): ThreadMessage[] {
  return [...messages].sort((left, right) => time(left.createdAt) - time(right.createdAt));
}

/** A closed conversation starts with a "closed" row at its last change. */
function initialNotices(conversation: ChatConversation): StatusNotice[] {
  return conversation.status === 'closed'
    ? [{ id: `closed-${conversation.updatedAt}`, status: 'closed', at: conversation.updatedAt }]
    : [];
}

/**
 * Turns an api answer into thread data. A refetch (after a reconnect, or on mount) keeps the
 * older pages and optimistic rows that were already on screen: the fresh messages are merged in
 * by id, the server copy winning (it carries the latest `readAt`).
 */
export function mergeThread(fresh: ChatThread, previous: ThreadData | undefined): ThreadData {
  if (!previous || previous.conversation.id !== fresh.conversation.id) {
    return { ...fresh, notices: initialNotices(fresh.conversation) };
  }

  const byId = new Map<string, ThreadMessage>();
  for (const message of previous.messages) byId.set(message.id, message);
  for (const message of fresh.messages) byId.set(message.id, message);

  const freshOldest = fresh.messages[0];
  const previousOldest = previous.messages.find((message) => !message.localId);
  // Older pages were loaded before and reach further back than the fresh page: their `hasMore` is the truth.
  const hasMore =
    freshOldest && previousOldest && time(previousOldest.createdAt) < time(freshOldest.createdAt)
      ? previous.hasMore
      : fresh.hasMore;

  return setConversation(
    { ...previous, messages: sortMessages([...byId.values()]), hasMore },
    fresh.conversation,
  );
}

/** Older messages arrived: they go before everything on screen. */
export function prependMessages(data: ThreadData, page: ChatMessagesPage): ThreadData {
  const known = new Set(data.messages.map((message) => message.id));
  const older = page.messages.filter((message) => !known.has(message.id));
  return { ...data, messages: [...older, ...data.messages], hasMore: page.hasMore };
}

/** The optimistic row that a server message of ours stands for, if any. */
function findPendingTwin(
  messages: ThreadMessage[],
  message: ChatMessage,
  side: ChatSenderRole,
): ThreadMessage | undefined {
  if (message.senderRole !== side) return undefined;
  return messages.find(
    (candidate) =>
      candidate.localId !== undefined &&
      candidate.state === 'sending' &&
      candidate.body === message.body &&
      candidate.imageFileId === message.imageFileId,
  );
}

/**
 * A message was pushed over the live stream (or came back from `send`). Duplicates are dropped,
 * and an optimistic row of ours is replaced by its server copy.
 */
export function appendMessage(
  data: ThreadData,
  message: ChatMessage,
  side: ChatSenderRole,
  localId?: string,
): ThreadData {
  if (data.messages.some((candidate) => candidate.id === message.id)) {
    // Already on screen (the stream outran `send`): only drop the optimistic twin.
    return localId
      ? { ...data, messages: data.messages.filter((candidate) => candidate.localId !== localId) }
      : data;
  }

  const twin = localId
    ? data.messages.find((candidate) => candidate.localId === localId)
    : findPendingTwin(data.messages, message, side);
  const messages = twin
    ? data.messages.map((candidate) => (candidate === twin ? message : candidate))
    : [...data.messages, message];

  return { ...data, messages: sortMessages(messages) };
}

export function addLocalMessage(data: ThreadData, message: ThreadMessage): ThreadData {
  return { ...data, messages: [...data.messages, message] };
}

export function setLocalState(data: ThreadData, localId: string, state: SendState): ThreadData {
  return {
    ...data,
    messages: data.messages.map((message) =>
      message.localId === localId ? { ...message, state } : message,
    ),
  };
}

export function removeLocalMessage(data: ThreadData, localId: string): ThreadData {
  return { ...data, messages: data.messages.filter((message) => message.localId !== localId) };
}

/** Messages of the given role that are not read yet. */
export function unreadCount(data: ThreadData, role: ChatSenderRole): number {
  return data.messages.filter(
    (message) => message.senderRole === role && message.readAt === null && !message.localId,
  ).length;
}

/** Marks every unread message of `role` as read at `readAt`. */
export function markRead(data: ThreadData, role: ChatSenderRole, readAt: string): ThreadData {
  if (unreadCount(data, role) === 0) return data;
  return {
    ...data,
    messages: data.messages.map((message) =>
      message.senderRole === role && message.readAt === null && !message.localId
        ? { ...message, readAt }
        : message,
    ),
  };
}

/**
 * The conversation changed (a status toggle, or the copy that travels with a pushed message).
 * A status change adds a system row at the time of the change.
 */
export function setConversation(data: ThreadData, conversation: ChatConversation): ThreadData {
  const changed = data.conversation.status !== conversation.status;
  const notices = changed
    ? [
        ...data.notices,
        {
          id: `${conversation.status}-${Date.now()}`,
          status: conversation.status,
          at: new Date().toISOString(),
        },
      ]
    : data.notices;
  return { ...data, conversation, notices };
}
