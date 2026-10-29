import {
  AUTH_COOKIES,
  type NotificationBroadcast,
  type NotificationItem,
  type NotificationSummary,
} from '@formula/shared';
import {
  Body,
  Controller,
  Get,
  HttpCode,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiCookieAuth, ApiOperation, ApiTags } from '@nestjs/swagger';

import { PaginationQueryDto } from '../../common/dto/pagination-query.dto.js';
import { PaginatedResult } from '../../common/paginated-result.js';
import { AdminSection } from '../access/access.decorators.js';
import type { RequestUser } from '../auth/auth.types.js';
import { CurrentUser } from '../auth/current-user.decorator.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { NotificationsListQueryDto, SendBroadcastDto } from './dto/notifications.dto.js';
import { NotificationsService } from './notifications.service.js';

const UUID = new ParseUUIDPipe();

@ApiTags('notifications')
@ApiCookieAuth(AUTH_COOKIES.ACCESS)
@UseGuards(JwtAuthGuard)
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notifications: NotificationsService) {}

  @Get()
  @ApiOperation({ summary: 'My notifications, newest first' })
  list(
    @CurrentUser() user: RequestUser,
    @Query() query: NotificationsListQueryDto,
  ): Promise<PaginatedResult<NotificationItem>> {
    return this.notifications.list(user.userId, query);
  }

  @Get('summary')
  @ApiOperation({ summary: 'Unread count, plus the review and support queues for admins' })
  summary(@CurrentUser() user: RequestUser): Promise<NotificationSummary> {
    return this.notifications.summary(user.userId);
  }

  @Post(':id/read')
  @HttpCode(200)
  @ApiOperation({ summary: 'Mark one notification read' })
  markRead(
    @CurrentUser() user: RequestUser,
    @Param('id', UUID) id: string,
  ): Promise<NotificationItem> {
    return this.notifications.markRead(user.userId, id);
  }

  @Post('read-all')
  @HttpCode(200)
  @ApiOperation({ summary: 'Mark every notification read' })
  markAllRead(@CurrentUser() user: RequestUser): Promise<{ unread: number }> {
    return this.notifications.markAllRead(user.userId);
  }
}

/** News for every student. Needs the `news` section. */
@ApiTags('admin')
@AdminSection('news')
@Controller('admin/news')
export class NewsAdminController {
  constructor(private readonly notifications: NotificationsService) {}

  @Post()
  @ApiOperation({ summary: 'Send a news item to every student (one notification each)' })
  send(
    @CurrentUser() user: RequestUser,
    @Body() dto: SendBroadcastDto,
  ): Promise<NotificationBroadcast> {
    return this.notifications.broadcast(user.userId, dto);
  }

  @Get()
  @ApiOperation({ summary: 'News sent so far, newest first' })
  list(@Query() query: PaginationQueryDto): Promise<PaginatedResult<NotificationBroadcast>> {
    return this.notifications.listBroadcasts(query.page, query.limit);
  }
}
