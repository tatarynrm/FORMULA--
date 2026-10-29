import {
  UA_PHONE_PATTERN,
  formatUkrainianPhoneInput,
  normalizeTelegramUsername,
  normalizeUkrainianPhone,
} from '@formula/shared';
import { describe, expect, it } from 'vitest';

import { toCanonicalPhone, toTelegramUsername } from './phone-transform.js';

describe('normalizeUkrainianPhone', () => {
  it.each([
    ['+380 98 938 55 85', '+380 98 938 55 85'],
    ['0989385585', '+380 98 938 55 85'],
    ['380989385585', '+380 98 938 55 85'],
    ['+380 (98) 938-55-85', '+380 98 938 55 85'],
    ['098 938 55 85', '+380 98 938 55 85'],
    ['989385585', '+380 98 938 55 85'],
    ['  +380501234567  ', '+380 50 123 45 67'],
  ])('writes %s as %s', (input, expected) => {
    expect(normalizeUkrainianPhone(input)).toBe(expected);
    expect(UA_PHONE_PATTERN.test(expected)).toBe(true);
  });

  it.each([
    '',
    '   ',
    '12345',
    '+1 202 555 0100',
    '+380 98 938 55',
    '+380 98 938 55 85 1',
    '+380 08 938 55 85',
    '00989385585',
    'телефон',
  ])('refuses %j (nothing is cut or guessed)', (input) => {
    expect(normalizeUkrainianPhone(input)).toBeNull();
  });
});

describe('formatUkrainianPhoneInput (while typing)', () => {
  it('builds the shape as far as the digits go', () => {
    expect(formatUkrainianPhoneInput('')).toBe('');
    expect(formatUkrainianPhoneInput('9')).toBe('+380 9');
    expect(formatUkrainianPhoneInput('98')).toBe('+380 98');
    expect(formatUkrainianPhoneInput('989')).toBe('+380 98 9');
    expect(formatUkrainianPhoneInput('0989385')).toBe('+380 98 938 5');
    expect(formatUkrainianPhoneInput('+380 98 93')).toBe('+380 98 93');
    expect(formatUkrainianPhoneInput('380989385585')).toBe('+380 98 938 55 85');
  });

  it('never grows past a full number', () => {
    expect(formatUkrainianPhoneInput('+380 98 938 55 85 123')).toBe('+380 98 938 55 85');
  });
});

describe('the transforms of the DTOs', () => {
  it('turn a written phone into the canonical one, empty into null, and leave the rest to the validator', () => {
    expect(toCanonicalPhone({ value: '0989385585' })).toBe('+380 98 938 55 85');
    expect(toCanonicalPhone({ value: '  ' })).toBeNull();
    expect(toCanonicalPhone({ value: '12345' })).toBe('12345');
    expect(toCanonicalPhone({ value: 42 })).toBe(42);
  });

  it('accept a Telegram nickname in any of its writings', () => {
    for (const input of [
      '@my_nick',
      'my_nick',
      't.me/my_nick',
      'https://t.me/my_nick',
      ' @my_nick ',
    ]) {
      expect(normalizeTelegramUsername(input)).toBe('my_nick');
      expect(toTelegramUsername({ value: input })).toBe('my_nick');
    }
    expect(toTelegramUsername({ value: '' })).toBeNull();
    expect(toTelegramUsername({ value: 'ab' })).toBe('ab'); // too short: the validator refuses it
    expect(normalizeTelegramUsername('1nick_x')).toBeNull(); // must start with a letter
    expect(normalizeTelegramUsername('ni ck_name')).toBeNull();
  });
});
