import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import type { Env } from '../../config/env.js';
import type {
  TelegramBotCommand,
  TelegramMe,
  TelegramReplyMarkup,
  TelegramUpdate,
} from './telegram.types.js';

/** Telegram answered with an error (or could not be reached: `code` 0). */
export class TelegramApiError extends Error {
  constructor(
    readonly code: number,
    readonly description: string,
  ) {
    super(`Telegram: ${description} (${code})`);
    this.name = 'TelegramApiError';
  }
}

/** A message limit of Telegram is 4096 characters. */
const MAX_TEXT = 4000;
const DEFAULT_TIMEOUT_MS = 10_000;

/**
 * A thin client of the Telegram Bot API over `fetch`. The token comes from `TELEGRAM_BOT_TOKEN`;
 * without it `configured` is false and nothing here is ever called. The token is never logged
 * and never part of an error message.
 */
@Injectable()
export class TelegramApi {
  private readonly token: string | undefined;

  constructor(config: ConfigService<Env, true>) {
    this.token = config.get('TELEGRAM_BOT_TOKEN', { infer: true });
  }

  get configured(): boolean {
    return this.token !== undefined;
  }

  async call<T>(
    method: string,
    params: Record<string, unknown> = {},
    options: { timeoutMs?: number; signal?: AbortSignal } = {},
  ): Promise<T> {
    if (!this.token) throw new TelegramApiError(0, 'the bot is not configured');

    const timeout = AbortSignal.timeout(options.timeoutMs ?? DEFAULT_TIMEOUT_MS);
    const signal = options.signal ? AbortSignal.any([options.signal, timeout]) : timeout;

    let response: Response;
    try {
      response = await fetch(`https://api.telegram.org/bot${this.token}/${method}`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(params),
        signal,
      });
    } catch (error) {
      // The raw error may carry the request address, which contains the token.
      throw new TelegramApiError(
        0,
        (error as Error).name === 'TimeoutError' ? 'timeout' : 'network error',
      );
    }

    const payload = (await response.json().catch(() => null)) as {
      ok?: boolean;
      result?: T;
      error_code?: number;
      description?: string;
    } | null;
    if (!payload?.ok) {
      throw new TelegramApiError(
        payload?.error_code ?? response.status,
        payload?.description ?? response.statusText,
      );
    }
    return payload.result as T;
  }

  getMe(): Promise<TelegramMe> {
    return this.call<TelegramMe>('getMe');
  }

  sendMessage(chatId: string, text: string, replyMarkup?: TelegramReplyMarkup): Promise<unknown> {
    return this.call('sendMessage', {
      chat_id: chatId,
      text: text.length > MAX_TEXT ? `${text.slice(0, MAX_TEXT - 1)}…` : text,
      // Plain text on purpose: titles and bodies come from people and must not be read as markup.
      link_preview_options: { is_disabled: true },
      ...(replyMarkup ? { reply_markup: replyMarkup } : {}),
    });
  }

  setMyCommands(commands: TelegramBotCommand[]): Promise<unknown> {
    return this.call('setMyCommands', { commands });
  }

  setWebhook(url: string, secretToken: string): Promise<unknown> {
    return this.call('setWebhook', {
      url,
      secret_token: secretToken,
      allowed_updates: ['message'],
    });
  }

  deleteWebhook(): Promise<unknown> {
    return this.call('deleteWebhook', { drop_pending_updates: false });
  }

  /** Long polling: Telegram holds the request up to `timeoutSeconds` until an update arrives. */
  getUpdates(
    offset: number,
    timeoutSeconds: number,
    signal: AbortSignal,
  ): Promise<TelegramUpdate[]> {
    return this.call<TelegramUpdate[]>(
      'getUpdates',
      { offset, timeout: timeoutSeconds, allowed_updates: ['message'] },
      { timeoutMs: (timeoutSeconds + 10) * 1000, signal },
    );
  }
}
