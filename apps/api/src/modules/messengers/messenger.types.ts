import type { MessengerBot } from '@formula/shared';

/** A person connected through a messenger bot (a row of `messenger_accounts`). */
export interface MessengerAccount {
  id: string;
  userId: string;
  provider: MessengerBot;
  /** The person in the messenger (Telegram user id). */
  externalId: string;
  /** The chat the bot writes to. */
  chatId: string;
  username: string | null;
  /** The number shared in the bot; `null` until then. */
  phone: string | null;
  phoneVerifiedAt: Date | null;
  notificationsEnabled: boolean;
  linkedAt: Date;
}

/** Who a bot is talking to, as the messenger tells us. */
export interface MessengerPerson {
  externalId: string;
  chatId: string;
  username: string | null;
}

/** What a notification looks like in a messenger: plain text with the link at the end. */
export interface OutgoingNotification {
  title: string;
  body: string;
  /** Full address inside the site, or `null`. */
  url: string | null;
}

/**
 * `sent`: delivered. `blocked`: the person stopped the bot or deleted the chat, so it makes no
 * sense to write again. `failed`: a hiccup, the notification just stays on the site.
 */
export type SendOutcome = 'sent' | 'blocked' | 'failed';

/**
 * One messenger the platform can talk to. Telegram is the first; a new one (Viber, ...) is a class
 * like `TelegramProvider` that registers itself in `MessengerRegistry`. Nothing else changes.
 */
export interface MessengerProvider {
  readonly name: MessengerBot;
  /** The bot can work: it has a token and is allowed to reach the messenger. */
  readonly configured: boolean;
  /** The name of the bot for the "open the bot" link (Telegram: `Formula_bot`), once known. */
  botUsername(): string | null;
  /** The address that opens the bot and hands it the one-time token. */
  linkUrl(token: string): string | null;
  send(account: MessengerAccount, message: OutgoingNotification): Promise<SendOutcome>;
  /** A last message after the person was disconnected on the site. Best effort, never throws. */
  farewell(account: MessengerAccount): Promise<void>;
}

/** What `acceptLinkToken` answers to a bot that received a connection link. */
export type AcceptLinkResult =
  | { ok: true; account: MessengerAccount; alreadyVerified: boolean }
  /** The token is unknown, used or expired. */
  | { ok: false; reason: 'invalid' }
  /** This person in the messenger is already connected to another account. */
  | { ok: false; reason: 'taken' };
