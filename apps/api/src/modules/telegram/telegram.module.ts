import { Module } from '@nestjs/common';

import { MessengersModule } from '../messengers/messengers.module.js';
import { TelegramBotService } from './telegram-bot.service.js';
import { TelegramUpdatesService } from './telegram-updates.service.js';
import { TelegramWebhookController } from './telegram-webhook.controller.js';
import { TelegramApi } from './telegram.api.js';
import { TelegramProvider } from './telegram.provider.js';

/**
 * The Telegram bot "Formula". It registers itself as a messenger provider; without
 * `TELEGRAM_BOT_TOKEN` it is dormant and the profile shows that the bot is not set up yet.
 */
@Module({
  imports: [MessengersModule],
  controllers: [TelegramWebhookController],
  providers: [TelegramApi, TelegramProvider, TelegramBotService, TelegramUpdatesService],
})
export class TelegramModule {}
