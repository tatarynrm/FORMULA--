import { Injectable, Logger, type OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import type { Env } from '../../config/env.js';
import { MessengerRegistry } from '../messengers/messenger-registry.service.js';
import type {
  MessengerAccount,
  MessengerProvider,
  OutgoingNotification,
  SendOutcome,
} from '../messengers/messenger.types.js';
import { TelegramApi, TelegramApiError } from './telegram.api.js';
import { TELEGRAM_TEXTS } from './telegram.texts.js';

/** A notification as a Telegram message: the title, the text, and the link at the end. */
export function formatNotification(message: OutgoingNotification): string {
  const lines = [message.title];
  if (message.body) lines.push(message.body);
  if (message.url) lines.push('', message.url);
  return lines.join('\n');
}

/** Telegram refuses with these when the person blocked the bot or deleted the chat. */
function isBlocked(error: TelegramApiError): boolean {
  return error.code === 403 || (error.code === 400 && /chat not found/i.test(error.description));
}

/** The Telegram side of `MessengerProvider`: the link to the bot and sending to a chat. */
@Injectable()
export class TelegramProvider implements MessengerProvider, OnModuleInit {
  readonly name = 'telegram' as const;
  private readonly logger = new Logger(TelegramProvider.name);
  private username: string | null;

  constructor(
    private readonly api: TelegramApi,
    private readonly registry: MessengerRegistry,
    config: ConfigService<Env, true>,
  ) {
    this.username = config.get('TELEGRAM_BOT_USERNAME', { infer: true }) ?? null;
  }

  onModuleInit(): void {
    this.registry.register(this);
  }

  get configured(): boolean {
    return this.api.configured;
  }

  /** Learned from `getMe` when `TELEGRAM_BOT_USERNAME` is not set. */
  setBotUsername(username: string): void {
    this.username = username;
  }

  botUsername(): string | null {
    return this.username;
  }

  linkUrl(token: string): string | null {
    return this.username ? `https://t.me/${this.username}?start=${token}` : null;
  }

  async send(account: MessengerAccount, message: OutgoingNotification): Promise<SendOutcome> {
    try {
      await this.api.sendMessage(account.chatId, formatNotification(message));
      return 'sent';
    } catch (error) {
      if (error instanceof TelegramApiError && isBlocked(error)) return 'blocked';
      this.logger.warn(`Could not send a Telegram message: ${(error as Error).message}`);
      return 'failed';
    }
  }

  async farewell(account: MessengerAccount): Promise<void> {
    if (!this.configured) return;
    try {
      await this.api.sendMessage(account.chatId, TELEGRAM_TEXTS.unlinked, {
        remove_keyboard: true,
      });
    } catch {
      // The person may have blocked the bot already; nothing to do.
    }
  }
}
