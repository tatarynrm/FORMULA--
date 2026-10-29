import { t } from '@/locales';

/** Fills `{placeholders}` in a dictionary string, e.g. `format(t.x, { name: 'Анна' })`. */
export function format(template: string, values: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (match, key: string) => String(values[key] ?? match));
}

/** Picks the Ukrainian plural form for `count`. Forms: [one, few, many]. */
export function pluralizeUk(count: number, forms: readonly [string, string, string]): string {
  const mod10 = count % 10;
  const mod100 = count % 100;
  if (mod10 === 1 && mod100 !== 11) return forms[0];
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return forms[1];
  return forms[2];
}

/** Splits a stat such as "500+" or "75%" into the number to animate and its suffix. */
export function parseStat(value: string): { to: number; suffix: string } {
  const match = /^(\d+)(.*)$/.exec(value.trim());
  return { to: Number(match?.[1] ?? 0), suffix: match?.[2] ?? '' };
}

const relativeFormatter = new Intl.RelativeTimeFormat('uk', { style: 'short' });
const timeFormatter = new Intl.DateTimeFormat('uk-UA', { hour: '2-digit', minute: '2-digit' });
const dateFormatter = new Intl.DateTimeFormat('uk-UA', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
});

const MINUTE = 60;
const HOUR = 3600;

const sameDay = (left: Date, right: Date) =>
  left.getFullYear() === right.getFullYear() &&
  left.getMonth() === right.getMonth() &&
  left.getDate() === right.getDate();

/**
 * A moment in the past the way people say it: "щойно", "5 хв тому", "2 год тому" (the same day),
 * "вчора о 14:30", else "12.10.2026". Pass `now` from a ticking clock (see `useNow`) so a list that
 * stays open keeps its times honest.
 */
export function formatRelativeTime(iso: string, now: number = Date.now()): string {
  const copy = t.notifications.relativeTime;
  const moment = new Date(iso);
  const nowDate = new Date(now);
  const seconds = Math.max(0, Math.floor((now - moment.getTime()) / 1000));

  if (seconds < MINUTE) return copy.justNow;
  if (seconds < HOUR) return relativeFormatter.format(-Math.floor(seconds / MINUTE), 'minute');
  if (sameDay(moment, nowDate))
    return relativeFormatter.format(-Math.floor(seconds / HOUR), 'hour');

  const yesterday = new Date(nowDate);
  yesterday.setDate(yesterday.getDate() - 1);
  if (sameDay(moment, yesterday))
    return format(copy.yesterdayAt, { time: timeFormatter.format(moment) });

  return dateFormatter.format(moment);
}
