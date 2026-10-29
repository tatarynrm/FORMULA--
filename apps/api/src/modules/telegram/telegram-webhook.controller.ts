import { timingSafeEqual } from 'node:crypto';

import { Body, Controller, Headers, HttpCode, NotFoundException, Post } from '@nestjs/common';
import { ApiExcludeController } from '@nestjs/swagger';
import { SkipThrottle } from '@nestjs/throttler';

import { TelegramBotService } from './telegram-bot.service.js';
import { TelegramUpdatesService } from './telegram-updates.service.js';
import type { TelegramUpdate } from './telegram.types.js';

function sameSecret(received: string | undefined, expected: string): boolean {
  const a = Buffer.from(received ?? '');
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

/**
 * Where Telegram delivers updates in webhook mode. Closed (404) unless the bot runs in webhook
 * mode, and every call must carry the secret that was given to Telegram when the webhook was set.
 * It answers at once and handles the update in the background, as Telegram expects.
 */
@ApiExcludeController()
@SkipThrottle()
@Controller({ path: 'messengers/telegram/webhook', version: '1' })
export class TelegramWebhookController {
  constructor(
    private readonly updates: TelegramUpdatesService,
    private readonly bot: TelegramBotService,
  ) {}

  @Post()
  @HttpCode(200)
  receive(
    @Headers('x-telegram-bot-api-secret-token') secret: string | undefined,
    @Body() update: TelegramUpdate,
  ): null {
    const expected = this.updates.webhookSecret;
    if (expected === null || !sameSecret(secret, expected)) throw new NotFoundException();
    void this.bot.handleUpdate(update);
    return null;
  }
}
