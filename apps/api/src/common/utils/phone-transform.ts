import { normalizeTelegramUsername, normalizeUkrainianPhone } from '@formula/shared';

/**
 * `@Transform` for a phone field. A number as people write it (`0989385585`, `+380 (98) 938-55-85`)
 * becomes `+380 98 938 55 85`. An empty value means "none" (`null`). Anything that is not a full
 * Ukrainian number stays as typed, so the format check next to it rejects it.
 */
export const toCanonicalPhone = ({ value }: { value: unknown }): unknown => {
  if (typeof value !== 'string') return value;
  const trimmed = value.trim();
  if (trimmed === '') return null;
  return normalizeUkrainianPhone(trimmed) ?? trimmed;
};

/** `@Transform` for a Telegram nickname: `@name`, `t.me/name` and `name` all become `name`; empty is `null`. */
export const toTelegramUsername = ({ value }: { value: unknown }): unknown => {
  if (typeof value !== 'string') return value;
  const trimmed = value.trim();
  if (trimmed === '') return null;
  return normalizeTelegramUsername(trimmed) ?? trimmed;
};
