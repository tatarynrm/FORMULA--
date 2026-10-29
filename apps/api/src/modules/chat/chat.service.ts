import type {
  ChatConversation,
  ChatMessage,
  ChatMessagesPage,
  ChatSenderRole,
  ChatStatus,
  ChatThread,
} from '@formula/shared';
import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { PaginatedResult } from '../../common/paginated-result.js';
import { AccessService } from '../access/access.service.js';
import { FilesService } from '../files/files.service.js';
import { NOTIFICATION_TEXTS, previewOf } from '../notifications/notification-texts.js';
import { NotificationsService } from '../notifications/notifications.service.js';
import { RealtimeService } from '../realtime/realtime.service.js';
import { ChatRepository } from './chat.repository.js';
import type {
  ChatMessagesQueryDto,
  ConversationListQueryDto,
  SendChatMessageDto,
} from './dto/chat.dto.js';

/** Everyone with the `support` section listens here (see `RealtimeController`). */
const SUPPORT_CHANNEL = 'support';
const SUPPORT_PAGE = '/admin/support';
const STUDENT_PAGE = '/cabinet/support';

/**
 * One conversation per student with the support team. Messages are stored, then pushed live to
 * the other side; the bell gets one coalesced notification per conversation.
 */
@Injectable()
export class ChatService {
  constructor(
    private readonly repository: ChatRepository,
    private readonly access: AccessService,
    private readonly files: FilesService,
    private readonly notifications: NotificationsService,
    private readonly realtime: RealtimeService,
  ) {}

  // ---- Student ----

  async getThread(studentId: string): Promise<ChatThread> {
    await this.assertStudent(studentId);
    const conversation = await this.repository.ensureConversation(studentId);
    return this.buildThread(conversation, 'student');
  }

  async loadOlder(studentId: string, query: ChatMessagesQueryDto): Promise<ChatMessagesPage> {
    const conversation = await this.requireOwnConversation(studentId);
    return this.repository.listMessages(conversation.id, query);
  }

  async send(studentId: string, dto: SendChatMessageDto): Promise<ChatMessage> {
    await this.assertStudent(studentId);
    const conversation = await this.repository.ensureConversation(studentId);
    const message = await this.storeMessage(conversation.id, studentId, 'student', dto);

    const [forStudent, forSupport] = await Promise.all([
      this.repository.findConversation(conversation.id, 'student'),
      this.repository.findConversation(conversation.id, 'support'),
    ]);
    if (forStudent) {
      this.realtime.publishToUser(studentId, {
        type: 'chat.message',
        message,
        conversation: forStudent,
      });
    }
    if (forSupport) {
      this.realtime.publishToChannel(SUPPORT_CHANNEL, {
        type: 'chat.message',
        message,
        conversation: forSupport,
      });
      const student = `${forSupport.student.name} ${forSupport.student.surname}`.trim();
      await this.notifications.notifySection('support', {
        type: 'chat_message',
        ...NOTIFICATION_TEXTS.chatFromStudent(
          student,
          previewOf(message.body, message.imageFileId !== null),
        ),
        link: `${SUPPORT_PAGE}?conversation=${conversation.id}`,
        data: { conversationId: conversation.id, studentId },
        coalesceBy: 'conversationId',
      });
    }
    return message;
  }

  async markRead(studentId: string): Promise<{ readAt: string | null }> {
    const conversation = await this.requireOwnConversation(studentId);
    const readAt = await this.repository.markRead(conversation.id, 'student');
    if (readAt) {
      this.realtime.publishToChannel(SUPPORT_CHANNEL, {
        type: 'chat.read',
        conversationId: conversation.id,
        readerRole: 'student',
        readAt: readAt.toISOString(),
      });
    }
    // The student is looking at the chat: its bell entries are seen too.
    await this.notifications.markReadByType(studentId, 'chat_message');
    return { readAt: readAt?.toISOString() ?? null };
  }

  async typing(studentId: string): Promise<{ ok: true }> {
    const conversation = await this.requireOwnConversation(studentId);
    this.realtime.publishToChannel(SUPPORT_CHANNEL, {
      type: 'chat.typing',
      conversationId: conversation.id,
      role: 'student',
      name: `${conversation.student.name} ${conversation.student.surname}`.trim(),
    });
    return { ok: true };
  }

  // ---- Support (admins with the `support` section) ----

  async listConversations(
    query: ConversationListQueryDto,
  ): Promise<PaginatedResult<ChatConversation>> {
    const { items, total } = await this.repository.listConversations({
      ...(query.status ? { status: query.status } : {}),
      ...(query.q ? { q: query.q } : {}),
      page: query.page,
      limit: query.limit,
    });
    return new PaginatedResult(items, total, query.page, query.limit);
  }

  async getThreadForSupport(conversationId: string): Promise<ChatThread> {
    const conversation = await this.requireConversation(conversationId, 'support');
    return this.buildThread(conversation, 'support');
  }

  async loadOlderForSupport(
    conversationId: string,
    query: ChatMessagesQueryDto,
  ): Promise<ChatMessagesPage> {
    await this.requireConversation(conversationId, 'support');
    return this.repository.listMessages(conversationId, query);
  }

  async sendAsSupport(
    adminId: string,
    conversationId: string,
    dto: SendChatMessageDto,
  ): Promise<ChatMessage> {
    const conversation = await this.requireConversation(conversationId, 'support');
    const message = await this.storeMessage(conversationId, adminId, 'support', dto);

    const [forStudent, forSupport] = await Promise.all([
      this.repository.findConversation(conversationId, 'student'),
      this.repository.findConversation(conversationId, 'support'),
    ]);
    if (forStudent) {
      this.realtime.publishToUser(conversation.student.id, {
        type: 'chat.message',
        message,
        conversation: forStudent,
      });
    }
    if (forSupport) {
      this.realtime.publishToChannel(SUPPORT_CHANNEL, {
        type: 'chat.message',
        message,
        conversation: forSupport,
      });
    }
    await this.notifications.notify(conversation.student.id, {
      type: 'chat_message',
      ...NOTIFICATION_TEXTS.chatFromSupport(previewOf(message.body, message.imageFileId !== null)),
      link: STUDENT_PAGE,
      data: { conversationId },
      coalesceBy: 'conversationId',
    });
    return message;
  }

  async markReadAsSupport(
    adminId: string,
    conversationId: string,
  ): Promise<{ readAt: string | null }> {
    const conversation = await this.requireConversation(conversationId, 'support');
    const readAt = await this.repository.markRead(conversationId, 'support');
    if (readAt) {
      const event = {
        type: 'chat.read' as const,
        conversationId,
        readerRole: 'support' as const,
        readAt: readAt.toISOString(),
      };
      this.realtime.publishToUser(conversation.student.id, event);
      // The other support admins see the unread badge go away too.
      this.realtime.publishToChannel(SUPPORT_CHANNEL, event);
    }
    await this.notifications.markReadByType(adminId, 'chat_message', {
      key: 'conversationId',
      value: conversationId,
    });
    return { readAt: readAt?.toISOString() ?? null };
  }

  async typingAsSupport(adminId: string, conversationId: string): Promise<{ ok: true }> {
    const conversation = await this.requireConversation(conversationId, 'support');
    this.realtime.publishToUser(conversation.student.id, {
      type: 'chat.typing',
      conversationId,
      role: 'support',
      name: (await this.repository.findUserName(adminId)) ?? '',
    });
    return { ok: true };
  }

  async setStatus(conversationId: string, status: ChatStatus): Promise<ChatConversation> {
    if (!(await this.repository.setStatus(conversationId, status))) {
      throw new NotFoundException('Conversation not found');
    }
    const [forStudent, forSupport] = await Promise.all([
      this.repository.findConversation(conversationId, 'student'),
      this.repository.findConversation(conversationId, 'support'),
    ]);
    if (forStudent) {
      this.realtime.publishToUser(forStudent.student.id, {
        type: 'chat.conversation',
        conversation: forStudent,
      });
    }
    if (forSupport) {
      this.realtime.publishToChannel(SUPPORT_CHANNEL, {
        type: 'chat.conversation',
        conversation: forSupport,
      });
    }
    return forSupport as ChatConversation;
  }

  // ---- helpers ----

  private async buildThread(
    conversation: ChatConversation,
    viewer: ChatSenderRole,
  ): Promise<ChatThread> {
    const { messages, hasMore } = await this.repository.listMessages(conversation.id, {
      limit: 50,
    });
    const current =
      viewer === 'student'
        ? conversation
        : ((await this.repository.findConversation(conversation.id, 'support')) ?? conversation);
    return { conversation: current, messages, hasMore };
  }

  private async storeMessage(
    conversationId: string,
    senderId: string,
    senderRole: ChatSenderRole,
    dto: SendChatMessageDto,
  ): Promise<ChatMessage> {
    const body = dto.body?.trim() ?? '';
    const imageFileId = dto.imageFileId ?? null;
    if (!body && !imageFileId) {
      throw new BadRequestException('A message needs text or a picture');
    }
    if (imageFileId && !(await this.files.isUnusedChatImageOf(senderId, imageFileId))) {
      throw new BadRequestException('The picture must be uploaded by you for the chat');
    }
    return this.repository.insertMessage({
      conversationId,
      senderId,
      senderRole,
      body,
      imageFileId,
    });
  }

  /** Admins answer from the support panel; the student side is for students only. */
  private async assertStudent(userId: string): Promise<void> {
    const context = await this.access.getContext(userId);
    if (!context) throw new NotFoundException('User not found');
    if (context.role === 'admin') {
      throw new ForbiddenException('Admins answer in the support panel');
    }
  }

  private async requireOwnConversation(studentId: string): Promise<ChatConversation> {
    const conversation = await this.repository.findConversationByStudent(studentId);
    if (!conversation) throw new NotFoundException('Conversation not found');
    return conversation;
  }

  private async requireConversation(id: string, viewer: ChatSenderRole): Promise<ChatConversation> {
    const conversation = await this.repository.findConversation(id, viewer);
    if (!conversation) throw new NotFoundException('Conversation not found');
    return conversation;
  }
}
