import { AUTH_COOKIES } from '@formula/shared';
import { Controller, Get, Res, UseGuards } from '@nestjs/common';
import { ApiCookieAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { Response } from 'express';

import { AccessService } from '../access/access.service.js';
import type { RequestUser } from '../auth/auth.types.js';
import { CurrentUser } from '../auth/current-user.decorator.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { RealtimeService } from './realtime.service.js';

/** Channel names an admin may listen to, by the section that grants them. */
const SECTION_CHANNELS: ReadonlyArray<{ section: string; channel: string }> = [
  { section: 'support', channel: 'support' },
  { section: 'reviews', channel: 'reviews' },
];

@ApiTags('realtime')
@ApiCookieAuth(AUTH_COOKIES.ACCESS)
@UseGuards(JwtAuthGuard)
@Controller()
export class RealtimeController {
  constructor(
    private readonly realtime: RealtimeService,
    private readonly access: AccessService,
  ) {}

  @Get('events')
  @ApiOperation({
    summary:
      'Server-Sent Events stream of live updates (notifications, chat) for the signed-in user',
  })
  async events(@CurrentUser() user: RequestUser, @Res() response: Response): Promise<void> {
    const context = await this.access.getContext(user.userId);
    if (!context) {
      response.status(401).end();
      return;
    }

    // Rights are read once, when the stream opens; a stream lives at most until the next reconnect.
    const channels = [context.role === 'admin' ? 'admins' : 'students'];
    for (const { section, channel } of SECTION_CHANNELS) {
      if (this.access.canUseSection(context, section)) channels.push(channel);
    }
    this.realtime.connect(user.userId, channels, response);
  }
}
