import type { AdminTest } from '@formula/shared';

import type { UpdateTestInput } from '../api/tests-api';
import type { TestSettingsDraft } from '../types';

// Limits of the api (`timeLimitSeconds` and `year` in the test DTOs).
export const TIME_LIMIT_MIN_SECONDS = 10;
export const TIME_LIMIT_MAX_SECONDS = 24 * 3600;
export const YEAR_MIN = 1900;
export const YEAR_MAX = 2200;

/** Maximum lengths of the free text fields (the api enforces the same). */
export const TEST_TEXT_LIMITS = { description: 2000, category: 100, specialty: 100 } as const;

const emptyToNull = (value: string): string | null => (value.trim() === '' ? null : value.trim());

function secondsToMinutesText(seconds: number): string {
  const minutes = seconds / 60;
  if (Number.isInteger(minutes)) return String(minutes);
  return String(Math.round(minutes * 100) / 100).replace('.', ',');
}

/** "30" or "1,5" (minutes) -> seconds, or `null` when the text is not a valid limit. */
export function parseTimeLimitSeconds(minutes: string): number | null {
  const normalized = minutes.trim().replace(',', '.');
  if (!/^\d+(\.\d+)?$/.test(normalized)) return null;

  const seconds = Math.round(Number(normalized) * 60);
  return seconds >= TIME_LIMIT_MIN_SECONDS && seconds <= TIME_LIMIT_MAX_SECONDS ? seconds : null;
}

/** "2025" -> 2025. `undefined` for an empty field, `null` when it is not a valid year. */
export function parseYear(value: string): number | null | undefined {
  const trimmed = value.trim();
  if (trimmed === '') return undefined;
  if (!/^\d{4}$/.test(trimmed)) return null;

  const year = Number(trimmed);
  return year >= YEAR_MIN && year <= YEAR_MAX ? year : null;
}

/**
 * Which fields of a test a form edits. `time-limit`: only the total time (the test of a subtopic
 * has no title of its own). `collection`: title, description, total time and the category, year
 * and specialty of a base, booklet or AMPS test.
 */
export type SettingsScope = 'time-limit' | 'collection';

export function settingsFromTest(test: AdminTest): TestSettingsDraft {
  return {
    title: test.title,
    description: test.description ?? '',
    timeLimitEnabled: test.timeLimitSeconds !== null,
    timeLimitMinutes:
      test.timeLimitSeconds === null ? '' : secondsToMinutesText(test.timeLimitSeconds),
    category: test.category ?? '',
    year: test.year === null ? '' : String(test.year),
    specialty: test.specialty ?? '',
  };
}

/** The total time of the form in seconds: `null` when the limit is off (or its text is not valid). */
export function timeLimitOf(settings: TestSettingsDraft): number | null {
  return settings.timeLimitEnabled ? parseTimeLimitSeconds(settings.timeLimitMinutes) : null;
}

/** Comparable text of the form, to tell whether anything changed since the last save. */
export function settingsSnapshot(settings: TestSettingsDraft, scope: SettingsScope): string {
  const timeLimit = settings.timeLimitEnabled ? settings.timeLimitMinutes.trim() : null;
  if (scope === 'time-limit') return JSON.stringify({ timeLimit });

  return JSON.stringify({
    title: settings.title.trim(),
    description: settings.description.trim(),
    timeLimit,
    category: settings.category.trim(),
    year: settings.year.trim(),
    specialty: settings.specialty.trim(),
  });
}

/**
 * The body of `PATCH /admin/tests/:id` for the settings form (valid input assumed, see
 * `validateTest`). Only the fields of the scope are sent, so saving the time limit of a subtopic
 * test never touches anything else.
 */
export function settingsToPatch(
  settings: TestSettingsDraft,
  scope: SettingsScope,
): UpdateTestInput {
  const timeLimitSeconds = timeLimitOf(settings);
  if (scope === 'time-limit') return { timeLimitSeconds };

  return {
    title: settings.title.trim(),
    description: emptyToNull(settings.description),
    timeLimitSeconds,
    category: emptyToNull(settings.category),
    year: parseYear(settings.year) ?? null,
    specialty: emptyToNull(settings.specialty),
  };
}
