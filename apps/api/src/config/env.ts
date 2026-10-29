import { z } from 'zod';

/** An optional setting that may also be present but empty in `.env` (`KEY=`), which means "not set". */
function optionalText(minLength = 1) {
  return z.preprocess(
    (value) => (typeof value === 'string' && value.trim() === '' ? undefined : value),
    z.string().min(minLength).optional(),
  );
}

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(4000),
  CORS_ORIGINS: z
    .string()
    .default('http://localhost:3000')
    .transform((value) =>
      value
        .split(',')
        .map((origin) => origin.trim())
        .filter(Boolean),
    ),
  DATABASE_URL: z.string().min(1),
  REDIS_URL: z.string().optional(),
  COOKIE_DOMAIN: z.string().optional(),
  JWT_ACCESS_SECRET: z.string().min(32),
  JWT_ACCESS_TTL: z
    .string()
    .regex(/^\d+(ms|s|m|h|d)$/)
    .default('15m'),
  JWT_REFRESH_SECRET: z.string().min(32),
  JWT_REFRESH_TTL: z
    .string()
    .regex(/^\d+(ms|s|m|h|d)$/)
    .default('7d'),
  // Where uploaded files live. Relative paths are resolved from the api working directory.
  STORAGE_DIR: z.string().min(1).default('./storage'),
  // Where browsers reach this api (no trailing slash); Google sends the sign-in callback here.
  API_PUBLIC_URL: z.string().url().default('http://localhost:4000'),
  // Where to send the browser after a Google sign-in; the first CORS origin when not set.
  WEB_URL: z.string().url().optional(),
  // Both or none: Google sign-in is off until both are set.
  GOOGLE_CLIENT_ID: z.string().min(1).optional(),
  GOOGLE_CLIENT_SECRET: z.string().min(1).optional(),
  // Telegram bot "Formula". Everything about it is off until a token is set.
  TELEGRAM_BOT_TOKEN: optionalText(),
  // The bot name without @ (for the "open the bot" link); looked up with getMe when not set.
  TELEGRAM_BOT_USERNAME: optionalText().transform((value) => value?.replace(/^@/, '')),
  // polling: the api asks Telegram for updates (no public address, ONE api instance only).
  // webhook: Telegram calls POST /api/messengers/telegram/webhook (needs API_PUBLIC_URL over https).
  TELEGRAM_MODE: z.enum(['polling', 'webhook']).default('polling'),
  // Secret Telegram sends with every webhook call; the webhook is closed without it.
  TELEGRAM_WEBHOOK_SECRET: optionalText(16),
  // Email through Resend. Everything about it is off until both the key and the sender are set.
  RESEND_API_KEY: optionalText(),
  // The sender shown to people, e.g. `Formula <noreply@formulachem.com.ua>` (the domain must be verified in Resend).
  MAIL_FROM: optionalText(),
  // Where replies go, e.g. support@formulachem.com.ua.
  MAIL_REPLY_TO: optionalText(),
  THROTTLE_TTL_MS: z.coerce.number().int().positive().default(60_000),
  THROTTLE_LIMIT: z.coerce.number().int().positive().default(100),
});

export type Env = z.infer<typeof envSchema>;

/** Used by `ConfigModule.forRoot({ validate })`. Throws on the first invalid start. */
export function validateEnv(config: Record<string, unknown>): Env {
  const result = envSchema.safeParse(config);

  if (!result.success) {
    const issues = result.error.issues
      .map((issue) => `  - ${issue.path.join('.')}: ${issue.message}`)
      .join('\n');
    throw new Error(`Invalid environment variables:\n${issues}`);
  }

  return result.data;
}
