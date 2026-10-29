import {
  Injectable,
  Logger,
  type OnApplicationBootstrap,
  type OnModuleDestroy,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import type { Env } from '../../config/env.js';
import { TelegramApi, TelegramApiError } from './telegram.api.js';
import { TelegramBotService } from './telegram-bot.service.js';
import { TelegramProvider } from './telegram.provider.js';
import { TELEGRAM_COMMANDS } from './telegram.texts.js';

/** Long polling holds one request this many seconds when nothing happens. */
const POLL_SECONDS = 25;
const RETRY_MS = 3000;
const CONFLICT_RETRY_MS = 10_000;
const WEBHOOK_PATH = '/api/messengers/telegram/webhook';

/**
 * Brings the updates of the bot to `TelegramBotService`, one of two ways (`TELEGRAM_MODE`):
 *  - polling (default): this api asks Telegram for new messages. Needs no public address, so it is
 *    what development uses. Run it on ONE api instance only.
 *  - webhook: Telegram calls `POST /api/messengers/telegram/webhook` (secret in a header).
 *    What production uses; works with any number of instances.
 * Without `TELEGRAM_BOT_TOKEN` it does nothing at all.
 */
@Injectable()
export class TelegramUpdatesService implements OnApplicationBootstrap, OnModuleDestroy {
  private readonly logger = new Logger(TelegramUpdatesService.name);
  private readonly abort = new AbortController();
  private stopped = false;
  private offset = 0;

  constructor(
    private readonly api: TelegramApi,
    private readonly bot: TelegramBotService,
    private readonly provider: TelegramProvider,
    private readonly config: ConfigService<Env, true>,
  ) {}

  /** The webhook route answers only when the bot runs in webhook mode and the secret is set. */
  get webhookSecret(): string | null {
    if (!this.api.configured || this.config.get('TELEGRAM_MODE', { infer: true }) !== 'webhook') {
      return null;
    }
    return this.config.get('TELEGRAM_WEBHOOK_SECRET', { infer: true }) ?? null;
  }

  onApplicationBootstrap(): void {
    if (!this.api.configured) {
      this.logger.log('Telegram bot is off (TELEGRAM_BOT_TOKEN is not set)');
      return;
    }
    // Starting the bot must never hold up or break the api.
    void this.start().catch((error: Error) => {
      this.logger.error(`Telegram bot did not start: ${error.message}`);
    });
  }

  onModuleDestroy(): void {
    this.stopped = true;
    this.abort.abort();
  }

  private async start(): Promise<void> {
    const me = await this.api.getMe();
    if (me.username) this.provider.setBotUsername(me.username);
    this.logger.log(`Telegram bot: @${me.username ?? me.id}`);
    await this.api.setMyCommands(TELEGRAM_COMMANDS);

    if (this.config.get('TELEGRAM_MODE', { infer: true }) === 'webhook') {
      const secret = this.config.get('TELEGRAM_WEBHOOK_SECRET', { infer: true });
      if (!secret) {
        this.logger.error('TELEGRAM_MODE=webhook needs TELEGRAM_WEBHOOK_SECRET: the bot is off');
        return;
      }
      const base = this.config.get('API_PUBLIC_URL', { infer: true }).replace(/\/$/, '');
      await this.api.setWebhook(`${base}${WEBHOOK_PATH}`, secret);
      this.logger.log(`Telegram webhook: ${base}${WEBHOOK_PATH}`);
      return;
    }

    // Polling and a webhook exclude each other: the webhook goes before the loop starts.
    await this.api.deleteWebhook();
    this.logger.log('Telegram bot: polling for updates');
    await this.poll();
  }

  private async poll(): Promise<void> {
    while (!this.stopped) {
      try {
        const updates = await this.api.getUpdates(this.offset, POLL_SECONDS, this.abort.signal);
        for (const update of updates) {
          this.offset = update.update_id + 1;
          // One at a time keeps a conversation in order.
          await this.bot.handleUpdate(update);
        }
      } catch (error) {
        if (this.stopped) return;
        const conflict = error instanceof TelegramApiError && error.code === 409;
        this.logger.warn(
          conflict
            ? 'Another process is polling this bot (is a second api running?)'
            : `Telegram polling failed: ${(error as Error).message}`,
        );
        await new Promise((resolve) =>
          setTimeout(resolve, conflict ? CONFLICT_RETRY_MS : RETRY_MS),
        );
      }
    }
  }
}
