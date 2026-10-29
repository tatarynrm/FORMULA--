import type { ChatSenderRole, MessengerBot } from '../constants/index.js';
import type { ChatConversation, ChatMessage } from './chat.js';
import type { NotificationItem } from './notifications.js';

/**
 * Events the api pushes over the `GET /events` stream (Server-Sent Events, JSON in `data`).
 * A client reacts to the ones it cares about and ignores the rest.
 */
export type RealtimeEvent =
  /** A new notification for this user, with the unread total after it. */
  | { type: 'notification'; notification: NotificationItem; unread: number }
  /** Notifications were read (here or in another tab); `unread` is the new total. */
  | { type: 'notifications.read'; unread: number }
  /** Something changed that the client should reload (a broadcast, a queue count). */
  | { type: 'notifications.refresh' }
  /** A new chat message in a conversation the user takes part in (or may handle, for support). */
  | { type: 'chat.message'; message: ChatMessage; conversation: ChatConversation }
  /** The other side read the messages of a conversation. */
  | { type: 'chat.read'; conversationId: string; readerRole: ChatSenderRole; readAt: string }
  /** The other side is typing (shown for `CHAT.TYPING_TTL_MS`). */
  | { type: 'chat.typing'; conversationId: string; role: ChatSenderRole; name: string }
  /** A conversation changed (status, for instance). */
  | { type: 'chat.conversation'; conversation: ChatConversation }
  /** The connection of a messenger bot changed (linked, phone shared, switched off, unlinked). */
  | { type: 'messenger.updated'; provider: MessengerBot };

export type RealtimeEventType = RealtimeEvent['type'];
