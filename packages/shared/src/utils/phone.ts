import { TELEGRAM_USERNAME_PATTERN } from '../constants/index.js';

/**
 * Ukrainian phone numbers, always written the same way: `+380 98 938 55 85`
 * (country code, 2-digit operator code, then 3 + 2 + 2 digits).
 */

/** The only accepted written form. The operator code never starts with 0. */
export const UA_PHONE_PATTERN = /^\+380 [1-9]\d \d{3} \d{2} \d{2}$/;

/** A shown example, for placeholders and hints. */
export const UA_PHONE_EXAMPLE = '+380 98 938 55 85';

/** Digits after the country code: operator code (2) + number (7). */
const NATIONAL_LENGTH = 9;

/** Digits of a number as people type them, without the country code and without a leading 0. */
function nationalDigits(input: string): string {
  const digits = input.replace(/\D/g, '');
  let national = digits;
  if (digits.startsWith('380')) national = digits.slice(3);
  else if (digits.length === NATIONAL_LENGTH + 1 && digits.startsWith('0'))
    national = digits.slice(1);
  // A leading 0 is the trunk prefix ("098 ..."), never part of the operator code.
  while (national.startsWith('0')) national = national.slice(1);
  return national.slice(0, NATIONAL_LENGTH);
}

/** `989385585` -> `+380 98 938 55 85`; fewer digits give the beginning of it. Empty stays empty. */
function formatNational(national: string): string {
  if (national === '') return '';
  const groups = [
    national.slice(0, 2),
    national.slice(2, 5),
    national.slice(5, 7),
    national.slice(7, 9),
  ];
  return `+380 ${groups.filter((group) => group !== '').join(' ')}`;
}

/**
 * The text of a phone field while a person types or pastes: whatever they enter becomes the
 * `+380 98 938 55 85` shape as far as the digits go. Accepts `0989385585`, `380989385585`,
 * `+380 (98) 938-55-85` and the like.
 */
export function formatUkrainianPhoneInput(input: string): string {
  return formatNational(nationalDigits(input));
}

/**
 * A complete Ukrainian number in the canonical form `+380 98 938 55 85`, or `null` when the input
 * is not exactly one: `380989385585`, `0989385585` and `989385585` are, with any spaces, dashes or
 * brackets around them; a number of another length or country, or an operator code that cannot
 * exist, is not (nothing is cut or guessed).
 */
export function normalizeUkrainianPhone(input: string): string | null {
  const digits = input.replace(/\D/g, '');
  let national: string;
  if (digits.length === NATIONAL_LENGTH + 3 && digits.startsWith('380')) national = digits.slice(3);
  else if (digits.length === NATIONAL_LENGTH + 1 && digits.startsWith('0'))
    national = digits.slice(1);
  else if (digits.length === NATIONAL_LENGTH) national = digits;
  else return null;

  const formatted = formatNational(national);
  return UA_PHONE_PATTERN.test(formatted) ? formatted : null;
}

/**
 * A Telegram nickname as people write it (`@name`, `name`, `t.me/name`, `https://t.me/name`)
 * without the at sign, or `null` when it is not a valid username.
 */
export function normalizeTelegramUsername(input: string): string | null {
  const username = input
    .trim()
    .replace(/^(https?:\/\/)?(www\.)?(t|telegram)\.me\//i, '')
    .replace(/^@/, '')
    .replace(/[/?#].*$/, '');
  return TELEGRAM_USERNAME_PATTERN.test(username) ? username : null;
}
