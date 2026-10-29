import type { MessengerBot } from '../constants/index.js';

/** How one messenger bot is connected for the signed-in user. */
export interface MessengerBotStatus {
  provider: MessengerBot;
  /** The bot is set up on the server (it has a token); without it nothing can be connected yet. */
  configured: boolean;
  /** `Formula_bot` (without `@`) for the "open the bot" link, once known. */
  botUsername: string | null;
  /** This account is tied to a person in the messenger. */
  linked: boolean;
  /**
   * Linked, but the phone number was not shared in the bot yet. The bot insists on it, and no
   * notification is sent before it.
   */
  awaitingPhone: boolean;
  /** The nickname the person has in the messenger (`@name`, without the at sign). */
  username: string | null;
  /** The number shared in the bot (`+380 98 938 55 85` for Ukrainian ones). */
  phone: string | null;
  /** Notifications go to the messenger (the person can switch them off). */
  notificationsEnabled: boolean;
  linkedAt: string | null;
}

/** A one-time link that opens the bot and connects it to this account. */
export interface MessengerBotLink {
  url: string;
  expiresAt: string;
}
