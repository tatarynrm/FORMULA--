import { format } from '@/lib/format';
import { t } from '@/locales';

const timeFormatter = new Intl.DateTimeFormat('uk-UA', { hour: '2-digit', minute: '2-digit' });
const dayFormatter = new Intl.DateTimeFormat('uk-UA', { day: 'numeric', month: 'long' });
const dayWithYearFormatter = new Intl.DateTimeFormat('uk-UA', {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
});
const shortDateFormatter = new Intl.DateTimeFormat('uk-UA', { day: '2-digit', month: '2-digit' });
const shortDateWithYearFormatter = new Intl.DateTimeFormat('uk-UA', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
});

const MINUTE_MS = 60_000;
const HOUR_MS = 60 * MINUTE_MS;

const sameDay = (left: Date, right: Date) =>
  left.getFullYear() === right.getFullYear() &&
  left.getMonth() === right.getMonth() &&
  left.getDate() === right.getDate();

function isYesterday(date: Date, now: Date): boolean {
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  return sameDay(date, yesterday);
}

/** "14:30" in local time. */
export function formatMessageTime(iso: string): string {
  return timeFormatter.format(new Date(iso));
}

/** Local calendar day, used to split the timeline into day sections. */
export function dayKey(iso: string): string {
  const date = new Date(iso);
  return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
}

/** Day separator: "Сьогодні", "Вчора", "12 жовтня", or with the year when it is not this one. */
export function formatDayLabel(iso: string, now: number): string {
  const date = new Date(iso);
  const nowDate = new Date(now);
  if (sameDay(date, nowDate)) return t.chat.thread.today;
  if (isYesterday(date, nowDate)) return t.chat.thread.yesterday;
  return date.getFullYear() === nowDate.getFullYear()
    ? dayFormatter.format(date)
    : dayWithYearFormatter.format(date);
}

/** Compact age for a list row: "щойно", "5 хв", "2 год", "вчора", "12.10", "12.10.2025". */
export function formatRelativeShort(iso: string, now: number): string {
  const copy = t.chat.time;
  const date = new Date(iso);
  const nowDate = new Date(now);
  const elapsed = Math.max(0, now - date.getTime());

  if (elapsed < MINUTE_MS) return copy.justNow;
  if (elapsed < HOUR_MS) return format(copy.minutes, { count: Math.floor(elapsed / MINUTE_MS) });
  if (sameDay(date, nowDate)) return format(copy.hours, { count: Math.floor(elapsed / HOUR_MS) });
  if (isYesterday(date, nowDate)) return copy.yesterday;
  return date.getFullYear() === nowDate.getFullYear()
    ? shortDateFormatter.format(date)
    : shortDateWithYearFormatter.format(date);
}
