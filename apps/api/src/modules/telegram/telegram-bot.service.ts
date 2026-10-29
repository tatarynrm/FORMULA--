import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import type { Env } from '../../config/env.js';
import type { MessengerPerson } from '../messengers/messenger.types.js';
import { MessengersService } from '../messengers/messengers.service.js';
import { TelegramApi } from './telegram.api.js';
import { SHARE_PHONE_BUTTON, TELEGRAM_TEXTS } from './telegram.texts.js';
import type { TelegramMessage, TelegramReplyMarkup, TelegramUpdate } from './telegram.types.js';

const PROVIDER = 'telegram' as const;

/** The "share my number" keyboard: one button, and Telegram sends the person's own contact. */
const PHONE_KEYBOARD: TelegramReplyMarkup = {
  keyboard: [[{ text: SHARE_PHONE_BUTTON, request_contact: true }]],
  resize_keyboard: true,
  one_time_keyboard: true,
};
const NO_KEYBOARD: TelegramReplyMarkup = { remove_keyboard: true };

/**
 * What the bot does with what people write. The whole conversation:
 *  1. `/start <token>` (the link from the profile on the site) ties this Telegram to the account;
 *  2. the bot then insists on the phone number (the button sends the person's OWN contact, and a
 *     contact of somebody else is refused); only then the link is complete and notifications start;
 *  3. `/stop` and `/start` switch notifications off and on, `/help` explains.
 * Nothing here throws: a broken update is logged and dropped, so the update loop never stops.
 */
@Injectable()
export class TelegramBotService {
  private readonly logger = new Logger(TelegramBotService.name);
  private readonly profileUrl: string;

  constructor(
    private readonly api: TelegramApi,
    private readonly messengers: MessengersService,
    config: ConfigService<Env, true>,
  ) {
    const webUrl = (
      config.get('WEB_URL', { infer: true }) ??
      config.get('CORS_ORIGINS', { infer: true })[0] ??
      ''
    ).replace(/\/$/, '');
    this.profileUrl = `${webUrl}/cabinet/profile`;
  }

  async handleUpdate(update: TelegramUpdate): Promise<void> {
    try {
      await this.process(update);
    } catch (error) {
      this.logger.warn(`Dropped a Telegram update: ${(error as Error).message}`);
    }
  }

  private async process(update: TelegramUpdate): Promise<void> {
    const message = update.message;
    // The bot talks to people one to one; groups and channels are ignored.
    if (!message?.from || message.from.is_bot || message.chat.type !== 'private') return;

    if (message.contact) return this.onContact(message);

    const command = /^\/(\w+)(?:@\w+)?(?:\s+(\S+))?/.exec(message.text?.trim() ?? '');
    if (command) {
      switch (command[1]?.toLowerCase()) {
        case 'start':
          return this.onStart(message, command[2] ?? '');
        case 'stop':
          return this.onStop(message);
        case 'help':
          return this.reply(message, TELEGRAM_TEXTS.help(this.profileUrl));
        default:
          break;
      }
    }
    return this.onOther(message);
  }

  // ---- Commands ----

  private async onStart(message: TelegramMessage, token: string): Promise<void> {
    const person = this.personOf(message);

    if (token) {
      const result = await this.messengers.acceptLinkToken(PROVIDER, token, person);
      if (!result.ok) {
        return this.reply(
          message,
          result.reason === 'taken' ? TELEGRAM_TEXTS.tokenTaken : TELEGRAM_TEXTS.tokenInvalid,
        );
      }
      return result.alreadyVerified
        ? this.reply(message, TELEGRAM_TEXTS.alreadyLinked, NO_KEYBOARD)
        : this.reply(message, TELEGRAM_TEXTS.askPhone, PHONE_KEYBOARD);
    }

    const account = await this.messengers.findByExternal(PROVIDER, person.externalId);
    if (!account) return this.reply(message, TELEGRAM_TEXTS.notLinked(this.profileUrl));
    await this.messengers.refreshUsername(account, person.username);

    if (!account.phoneVerifiedAt)
      return this.reply(message, TELEGRAM_TEXTS.askPhone, PHONE_KEYBOARD);
    if (!account.notificationsEnabled) {
      await this.messengers.setNotificationsFor(account, true);
      return this.reply(message, TELEGRAM_TEXTS.resumed);
    }
    return this.reply(message, TELEGRAM_TEXTS.alreadyLinked);
  }

  private async onStop(message: TelegramMessage): Promise<void> {
    const account = await this.messengers.findByExternal(
      PROVIDER,
      this.personOf(message).externalId,
    );
    if (!account) return this.reply(message, TELEGRAM_TEXTS.notLinked(this.profileUrl));
    await this.messengers.setNotificationsFor(account, false);
    return this.reply(message, TELEGRAM_TEXTS.stopped);
  }

  /** Any other text: while the phone is missing the bot asks for it again, it is not optional. */
  private async onOther(message: TelegramMessage): Promise<void> {
    const account = await this.messengers.findByExternal(
      PROVIDER,
      this.personOf(message).externalId,
    );
    if (!account) return this.reply(message, TELEGRAM_TEXTS.notLinked(this.profileUrl));
    if (!account.phoneVerifiedAt)
      return this.reply(message, TELEGRAM_TEXTS.needPhone, PHONE_KEYBOARD);
    return this.reply(message, TELEGRAM_TEXTS.idle);
  }

  // ---- The phone number ----

  private async onContact(message: TelegramMessage): Promise<void> {
    const person = this.personOf(message);
    const contact = message.contact;
    if (!contact) return;

    const account = await this.messengers.findByExternal(PROVIDER, person.externalId);
    if (!account) return this.reply(message, TELEGRAM_TEXTS.notLinked(this.profileUrl));

    // The button sends the person's own contact. A forwarded or hand-picked contact has another
    // (or no) `user_id`: it proves nothing about this person, so it is refused.
    if (String(contact.user_id ?? '') !== person.externalId) {
      return this.reply(message, TELEGRAM_TEXTS.notYourNumber, PHONE_KEYBOARD);
    }

    await this.messengers.refreshUsername(account, person.username);
    await this.messengers.confirmPhone(account, contact.phone_number);
    return this.reply(message, TELEGRAM_TEXTS.done, NO_KEYBOARD);
  }

  // ---- helpers ----

  private personOf(message: TelegramMessage): MessengerPerson {
    return {
      externalId: String(message.from?.id ?? ''),
      chatId: String(message.chat.id),
      username: message.from?.username ?? null,
    };
  }

  /** Answers in the same chat. A failed answer is only logged: the update itself was handled. */
  private async reply(
    message: TelegramMessage,
    text: string,
    markup?: TelegramReplyMarkup,
  ): Promise<void> {
    try {
      await this.api.sendMessage(String(message.chat.id), text, markup);
    } catch (error) {
      this.logger.warn(`Could not answer in Telegram: ${(error as Error).message}`);
    }
  }
}
