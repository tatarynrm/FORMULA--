import type { ChatSenderRole, ChatStatus } from '../constants/index.js';

/** The student side of a support conversation (the support side is "the team", not one person). */
export interface ChatParticipant {
  id: string;
  name: string;
  surname: string;
  email: string;
  avatarFileId: string | null;
}

export interface ChatMessage {
  id: string;
  conversationId: string;
  /** `null` once the account was deleted. */
  senderId: string | null;
  senderRole: ChatSenderRole;
  /** Display name of the sender at the time of sending ("Підтримка" for the team by default). */
  senderName: string;
  body: string;
  /** A picture uploaded with purpose `chat`, shown inline. */
  imageFileId: string | null;
  createdAt: string;
  /** When the other side read it (`null` = not yet). */
  readAt: string | null;
}

export interface ChatLastMessage {
  body: string;
  hasImage: boolean;
  senderRole: ChatSenderRole;
  createdAt: string;
}

/** One student ↔ support thread. `unreadCount` is for whoever asked (student or support). */
export interface ChatConversation {
  id: string;
  status: ChatStatus;
  student: ChatParticipant;
  lastMessage: ChatLastMessage | null;
  unreadCount: number;
  createdAt: string;
  updatedAt: string;
}

/** The thread with its latest messages, oldest first; `hasMore` says older ones exist. */
export interface ChatThread {
  conversation: ChatConversation;
  messages: ChatMessage[];
  hasMore: boolean;
}

/** An older page of messages (oldest first); load it with `?before=<oldest message id on screen>`. */
export interface ChatMessagesPage {
  messages: ChatMessage[];
  hasMore: boolean;
}

export interface SendChatMessageInput {
  body?: string;
  imageFileId?: string | null;
}

export interface ChatConversationListQuery {
  status?: ChatStatus;
  /** Matches the student's name, surname or email. */
  q?: string;
  page?: number;
  limit?: number;
}
