import type {
  ChatConversation,
  ChatMessage,
  ChatSenderRole,
  ChatStatus,
  PaginationMeta,
} from '@formula/shared';

import type { ThreadEndpoints } from '../api/chat-api';

/** An optimistic message is `sending` until the api answers; `failed` offers a retry. */
export type SendState = 'sending' | 'failed';

/**
 * A message on screen: one from the api, or one of ours that is still on its way. The latter
 * carries a `localId` (also used as `id` until the server message replaces it) and a `state`.
 */
export interface ThreadMessage extends ChatMessage {
  localId?: string;
  state?: SendState;
}

/** A system row in the timeline: the conversation was closed or opened again. */
export interface StatusNotice {
  id: string;
  status: ChatStatus;
  /** When it happened; the row is sorted among the messages by it. */
  at: string;
}

/** What the thread query holds: the api answer plus client-only state (optimistic rows, notices). */
export interface ThreadData {
  conversation: ChatConversation;
  /** Oldest first. */
  messages: ThreadMessage[];
  /** Older messages exist before the first one. */
  hasMore: boolean;
  notices: StatusNotice[];
}

/**
 * Which thread a component works with: the student's own one or an admin's view of a
 * conversation. `side` says which messages are "ours" (shown on the right).
 */
export interface ThreadScope {
  side: ChatSenderRole;
  queryKey: readonly unknown[];
  endpoints: ThreadEndpoints;
}

/** Filters of the admin inbox list (the page number is handled by the infinite query). */
export interface ConversationListFilter {
  status: ChatStatus;
  q: string;
}

export interface ConversationPage {
  items: ChatConversation[];
  meta: PaginationMeta;
}
