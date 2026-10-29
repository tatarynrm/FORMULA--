import { AUTH_COOKIES, type MessengerBotLink, type MessengerBotStatus } from '@formula/shared';
import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiCookieAuth, ApiOperation, ApiProperty, ApiTags } from '@nestjs/swagger';
import { IsBoolean } from 'class-validator';

import type { RequestUser } from '../auth/auth.types.js';
import { CurrentUser } from '../auth/current-user.decorator.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { MessengersService } from './messengers.service.js';

export class MessengerSettingsDto {
  @ApiProperty({ description: 'Send notifications to the messenger' })
  @IsBoolean()
  notificationsEnabled!: boolean;
}

/**
 * Connect a messenger bot to the signed-in account. `:provider` is the messenger (`telegram`);
 * a new messenger needs no new routes.
 */
@ApiTags('messengers')
@ApiCookieAuth(AUTH_COOKIES.ACCESS)
@UseGuards(JwtAuthGuard)
@Controller('messengers/:provider')
export class MessengersController {
  constructor(private readonly messengers: MessengersService) {}

  @Get()
  @ApiOperation({ summary: 'Is the bot set up, and is it connected to my account' })
  status(
    @CurrentUser() user: RequestUser,
    @Param('provider') provider: string,
  ): Promise<MessengerBotStatus> {
    return this.messengers.getStatus(user.userId, provider);
  }

  @Post('link')
  @HttpCode(200)
  @ApiOperation({
    summary: 'A one-time address that opens the bot and connects it to my account (15 minutes)',
  })
  link(
    @CurrentUser() user: RequestUser,
    @Param('provider') provider: string,
  ): Promise<MessengerBotLink> {
    return this.messengers.createLink(user.userId, provider);
  }

  @Delete('link')
  @HttpCode(200)
  @ApiOperation({ summary: 'Disconnect the bot from my account' })
  unlink(
    @CurrentUser() user: RequestUser,
    @Param('provider') provider: string,
  ): Promise<MessengerBotStatus> {
    return this.messengers.unlink(user.userId, provider);
  }

  @Patch('settings')
  @ApiOperation({ summary: 'Switch notifications in the messenger on or off' })
  settings(
    @CurrentUser() user: RequestUser,
    @Param('provider') provider: string,
    @Body() dto: MessengerSettingsDto,
  ): Promise<MessengerBotStatus> {
    return this.messengers.setNotifications(user.userId, provider, dto.notificationsEnabled);
  }
}
