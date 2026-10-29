export const API_PREFIX = 'api';
export const API_DEFAULT_VERSION = '1';

/** Machine-readable error codes returned in `ApiErrorResponse.error.code`. */
export const ERROR_CODES = {
  VALIDATION_FAILED: 'VALIDATION_FAILED',
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  NOT_FOUND: 'NOT_FOUND',
  CONFLICT: 'CONFLICT',
  // Taking a test: the client reacts differently to each, so they have their own codes.
  /** The attempt is already finished (here or on another device). */
  ATTEMPT_FINISHED: 'ATTEMPT_FINISHED',
  /** The time limit of the attempt is over: no more answers are accepted. */
  TIME_OVER: 'TIME_OVER',
  /** With explanations on, an answer cannot be changed after it was given. */
  ANSWER_FINAL: 'ANSWER_FINAL',
  TOO_MANY_REQUESTS: 'TOO_MANY_REQUESTS',
  INTERNAL: 'INTERNAL_SERVER_ERROR',
  SERVICE_UNAVAILABLE: 'SERVICE_UNAVAILABLE',
  // Auth-specific codes, so the client can show a precise localized message.
  INVALID_CREDENTIALS: 'INVALID_CREDENTIALS',
  EMAIL_TAKEN: 'EMAIL_TAKEN',
  SESSION_EXPIRED: 'SESSION_EXPIRED',
} as const;

export type ErrorCode = (typeof ERROR_CODES)[keyof typeof ERROR_CODES];

export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 20,
  MAX_LIMIT: 100,
} as const;

export const AUTH = {
  PASSWORD_MIN_LENGTH: 8,
  PASSWORD_MAX_LENGTH: 72,
  NAME_MIN_LENGTH: 2,
  NAME_MAX_LENGTH: 100,
  SURNAME_MIN_LENGTH: 2,
  SURNAME_MAX_LENGTH: 100,
} as const;

/** httpOnly cookies set by the api. The web proxy only checks that the refresh cookie exists. */
export const AUTH_COOKIES = {
  ACCESS: 'access_token',
  REFRESH: 'refresh_token',
} as const;

export const USER_ROLES = ['student', 'admin'] as const;
export type UserRole = (typeof USER_ROLES)[number];

/** `superadmin` can do everything; `subadmin` only uses the sections granted to them. */
export const ADMIN_LEVELS = ['superadmin', 'subadmin'] as const;
export type AdminLevel = (typeof ADMIN_LEVELS)[number];

/** Who a menu item is meant for. */
export const MENU_AUDIENCES = ['student', 'admin'] as const;
export type MenuAudience = (typeof MENU_AUDIENCES)[number];

/** Icons a menu item may use. The web app maps each name to an SVG. */
export const MENU_ICONS = [
  'home',
  'book-open',
  'book',
  'amps',
  'saved',
  'students',
  'team',
  'menu',
  'file',
  'test',
  'bell',
  'chat',
  'star',
] as const;
export type MenuIcon = (typeof MENU_ICONS)[number];

/** `link` opens a path of the site, `page` opens a page whose text the superadmin writes. */
export const MENU_ITEM_KINDS = ['link', 'page'] as const;
export type MenuItemKind = (typeof MENU_ITEM_KINDS)[number];

export const MENU = {
  LABEL_MAX_LENGTH: 40,
  HREF_MAX_LENGTH: 200,
  PAGE_MAX_LENGTH: 200_000,
} as const;

export const INSTITUTION_KINDS = ['university', 'other'] as const;
export type InstitutionKind = (typeof INSTITUTION_KINDS)[number];

/** Online tracking (see the presence module of the api). */
export const PRESENCE = {
  /** A user seen within this many seconds counts as online. */
  ONLINE_WINDOW_SECONDS: 300,
  /** A pause longer than this starts a new session in the history. */
  SESSION_GAP_SECONDS: 900,
} as const;

export const PROFILE = {
  INSTITUTION_MAX_LENGTH: 200,
} as const;

/** Messengers a person may say they use (profile, "how to reach me"). Add one here to offer it. */
export const MESSENGERS = ['viber', 'whatsapp', 'telegram'] as const;
export type Messenger = (typeof MESSENGERS)[number];

/**
 * Messengers that can be connected through a bot, so the account also receives notifications
 * there. Each one needs its own provider in the api (`modules/messengers`); Telegram is the first.
 */
export const MESSENGER_BOTS = ['telegram'] as const;
export type MessengerBot = (typeof MESSENGER_BOTS)[number];

/** A Telegram username (without `@`): 5 to 32 letters, digits and underscores, starting with a letter. */
export const TELEGRAM_USERNAME_PATTERN = /^[A-Za-z][A-Za-z0-9_]{4,31}$/;

export const MESSENGER_LINK = {
  /** A connection link (one-time token) works this long. */
  TOKEN_TTL_MINUTES: 15,
} as const;

/**
 * What a notification is about. The web picks an icon per type; future channels (Telegram, email)
 * can filter by it. `system` is for anything that has no type of its own yet.
 */
export const NOTIFICATION_TYPES = [
  /** Admin: a situational attempt waits for a review. */
  'review_pending',
  /** Student: an admin graded their situational attempt. */
  'review_done',
  /** Student: an admin opened a subject or subtopics for them. */
  'access_granted',
  /** Student: a news item the admin sent to everyone. */
  'news',
  /** Both: a new message in the support chat. */
  'chat_message',
  /** Admin: a visitor left a testimonial that waits for moderation. */
  'testimonial_pending',
  /** Student: an admin published or rejected their testimonial. */
  'testimonial_result',
  'system',
] as const;
export type NotificationType = (typeof NOTIFICATION_TYPES)[number];

export const NOTIFICATIONS = {
  TITLE_MAX_LENGTH: 120,
  BODY_MAX_LENGTH: 2000,
  LINK_MAX_LENGTH: 200,
  PAGE_SIZE: 20,
} as const;

/** A support conversation is `open` until an admin closes it; a new student message reopens it. */
export const CHAT_STATUSES = ['open', 'closed'] as const;
export type ChatStatus = (typeof CHAT_STATUSES)[number];

/** Who wrote a chat message: the student, or someone from the support team. */
export const CHAT_SENDER_ROLES = ['student', 'support'] as const;
export type ChatSenderRole = (typeof CHAT_SENDER_ROLES)[number];

export const CHAT = {
  MESSAGE_MAX_LENGTH: 4000,
  /** Messages loaded per page (newest first, older ones on scroll). */
  PAGE_SIZE: 50,
  /** How long "is typing" stays on screen after the last typing event. */
  TYPING_TTL_MS: 4000,
  /** The client sends a typing event at most this often. */
  TYPING_THROTTLE_MS: 2500,
} as const;

/** A testimonial waits as `pending` until an admin publishes (`approved`) or declines (`rejected`) it. */
export const TESTIMONIAL_STATUSES = ['pending', 'approved', 'rejected'] as const;
export type TestimonialStatus = (typeof TESTIMONIAL_STATUSES)[number];

export const TESTIMONIALS = {
  TEXT_MIN_LENGTH: 10,
  TEXT_MAX_LENGTH: 1500,
  RATING_MIN: 1,
  RATING_MAX: 5,
  /** How many published testimonials the landing page loads. */
  PUBLIC_LIMIT: 60,
  /** A guest (no account) may send this many per hour from one address. */
  GUEST_PER_HOUR: 3,
} as const;

/** Live updates (notifications, chat) arrive over one Server-Sent Events stream per tab. */
export const REALTIME = {
  /** Relative to the api base URL (`NEXT_PUBLIC_API_URL`). */
  PATH: '/v1/events',
  /** The api sends a comment this often so proxies keep the stream open. */
  KEEPALIVE_MS: 25_000,
  /** First reconnect delay of the client; it doubles up to 30 s. */
  RETRY_MS: 3000,
} as const;
export * from './content.js';
