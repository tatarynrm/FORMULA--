/** The small part of the Telegram Bot API that the bot uses (https://core.telegram.org/bots/api). */

export interface TelegramUser {
  id: number;
  is_bot: boolean;
  first_name: string;
  username?: string;
}

export interface TelegramChat {
  id: number;
  type: 'private' | 'group' | 'supergroup' | 'channel';
}

/** A contact the person sent; with the "share my number" button it is their own (`user_id` matches). */
export interface TelegramContact {
  phone_number: string;
  first_name: string;
  user_id?: number;
}

export interface TelegramMessage {
  message_id: number;
  from?: TelegramUser;
  chat: TelegramChat;
  text?: string;
  contact?: TelegramContact;
}

export interface TelegramUpdate {
  update_id: number;
  message?: TelegramMessage;
}

/** A keyboard with one button that asks Telegram to send the person's own phone number. */
export interface TelegramRequestContactKeyboard {
  keyboard: { text: string; request_contact: true }[][];
  resize_keyboard: true;
  one_time_keyboard: true;
}

export interface TelegramRemoveKeyboard {
  remove_keyboard: true;
}

export type TelegramReplyMarkup = TelegramRequestContactKeyboard | TelegramRemoveKeyboard;

export interface TelegramBotCommand {
  command: string;
  description: string;
}

export interface TelegramMe {
  id: number;
  username?: string;
}
