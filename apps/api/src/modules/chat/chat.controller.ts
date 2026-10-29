import {
  AUTH_COOKIES,
  type ChatConversation,
  type ChatMessage,
  type ChatMessagesPage,
  type ChatThread,
} from '@formula/shared';
import {
  Body,
  Controller,
  Get,
  HttpCode,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiCookieAuth, ApiOperation, ApiTags } from '@nestjs/swagger';

import { PaginatedResult } from '../../common/paginated-result.js';
import { AdminSection } from '../access/access.decorators.js';
import type { RequestUser } from '../auth/auth.types.js';
import { CurrentUser } from '../auth/current-user.decorator.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { ChatService } from './chat.service.js';
import {
  ChatMessagesQueryDto,
  ConversationListQueryDto,
  SendChatMessageDto,
  UpdateConversationDto,
} from './dto/chat.dto.js';

const UUID = new ParseUUIDPipe();

/** The student's side: one conversation with the support team. */
@ApiTags('chat')
@ApiCookieAuth(AUTH_COOKIES.ACCESS)
@UseGuards(JwtAuthGuard)
@Controller({ path: 'chat', version: '1' })
export class ChatController {
  constructor(private readonly chat: ChatService) {}

  @Get()
  @ApiOperation({
    summary: 'My support conversation with its latest messages (created on first call)',
  })
  thread(@CurrentUser() user: RequestUser): Promise<ChatThread> {
    return this.chat.getThread(user.userId);
  }

  @Get('messages')
  @ApiOperation({ summary: 'Older messages of my conversation' })
  older(
    @CurrentUser() user: RequestUser,
    @Query() query: ChatMessagesQueryDto,
  ): Promise<ChatMessagesPage> {
    return this.chat.loadOlder(user.userId, query);
  }

  @Post('messages')
  @ApiOperation({ summary: 'Send a message (text and/or a picture uploaded with purpose "chat")' })
  send(@CurrentUser() user: RequestUser, @Body() dto: SendChatMessageDto): Promise<ChatMessage> {
    return this.chat.send(user.userId, dto);
  }

  @Post('read')
  @HttpCode(200)
  @ApiOperation({ summary: 'Mark the support messages as read' })
  read(@CurrentUser() user: RequestUser): Promise<{ readAt: string | null }> {
    return this.chat.markRead(user.userId);
  }

  @Post('typing')
  @HttpCode(200)
  @ApiOperation({ summary: 'Tell the support team that I am typing' })
  typing(@CurrentUser() user: RequestUser): Promise<{ ok: true }> {
    return this.chat.typing(user.userId);
  }
}

/** The support side. Needs the `support` section. */
@ApiTags('admin')
@AdminSection('support')
@Controller({ path: 'admin/chat/conversations', version: '1' })
export class ChatSupportController {
  constructor(private readonly chat: ChatService) {}

  @Get()
  @ApiOperation({
    summary: 'Conversations by last activity, with unread counts; filter and search',
  })
  list(@Query() query: ConversationListQueryDto): Promise<PaginatedResult<ChatConversation>> {
    return this.chat.listConversations(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'A conversation with its latest messages' })
  thread(@Param('id', UUID) id: string): Promise<ChatThread> {
    return this.chat.getThreadForSupport(id);
  }

  @Get(':id/messages')
  @ApiOperation({ summary: 'Older messages of a conversation' })
  older(
    @Param('id', UUID) id: string,
    @Query() query: ChatMessagesQueryDto,
  ): Promise<ChatMessagesPage> {
    return this.chat.loadOlderForSupport(id, query);
  }

  @Post(':id/messages')
  @ApiOperation({ summary: 'Answer the student' })
  send(
    @CurrentUser() user: RequestUser,
    @Param('id', UUID) id: string,
    @Body() dto: SendChatMessageDto,
  ): Promise<ChatMessage> {
    return this.chat.sendAsSupport(user.userId, id, dto);
  }

  @Post(':id/read')
  @HttpCode(200)
  @ApiOperation({ summary: "Mark the student's messages as read" })
  read(
    @CurrentUser() user: RequestUser,
    @Param('id', UUID) id: string,
  ): Promise<{ readAt: string | null }> {
    return this.chat.markReadAsSupport(user.userId, id);
  }

  @Post(':id/typing')
  @HttpCode(200)
  @ApiOperation({ summary: 'Tell the student that someone is typing' })
  typing(@CurrentUser() user: RequestUser, @Param('id', UUID) id: string): Promise<{ ok: true }> {
    return this.chat.typingAsSupport(user.userId, id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Close a conversation, or open it again' })
  update(
    @Param('id', UUID) id: string,
    @Body() dto: UpdateConversationDto,
  ): Promise<ChatConversation> {
    return this.chat.setStatus(id, dto.status);
  }
}
