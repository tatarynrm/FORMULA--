import { format } from '@/lib/format';
import { t } from '@/locales';

import { formatDate } from './format-date';

const relative = new Intl.RelativeTimeFormat('uk', { style: 'short' });
const timeFormatter = new Intl.DateTimeFormat('uk-UA', { hour: '2-digit', minute: '2-digit' });

const MINUTE = 60;
const HOUR = 3600;

const sameDay = (left: Date, right: Date) =>
  left.getFullYear() === right.getFullYear() &&
  left.getMonth() === right.getMonth() &&
  left.getDate() === right.getDate();

/** "14:30". */
export function formatTime(iso: string): string {
  return timeFormatter.format(new Date(iso));
}

/**
 * When a student was last seen, the way people say it: "щойно", "5 хв тому", "2 год тому" (the
 * same day), "вчора о 14:30", else "12.10.2026 о 09:15". `now` is the current time.
 */
export function formatLastSeen(iso: string, now: number): string {
  const copy = t.adminContent.students;
  const seen = new Date(iso);
  const nowDate = new Date(now);
  const seconds = Math.max(0, Math.floor((now - seen.getTime()) / 1000));

  if (seconds < MINUTE) return copy.justNow;
  if (seconds < HOUR) return relative.format(-Math.floor(seconds / MINUTE), 'minute');
  if (sameDay(seen, nowDate)) return relative.format(-Math.floor(seconds / HOUR), 'hour');

  const yesterday = new Date(nowDate);
  yesterday.setDate(yesterday.getDate() - 1);
  if (sameDay(seen, yesterday)) return format(copy.yesterdayAt, { time: formatTime(iso) });

  return format(copy.dateAt, { date: formatDate(iso), time: formatTime(iso) });
}

/** "1 год 12 хв", "45 хв", or "менше хвилини". */
export function formatDuration(seconds: number): string {
  const copy = t.adminContent.students.duration;
  const minutes = Math.floor(seconds / MINUTE);
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;

  if (hours > 0) {
    return rest > 0
      ? format(copy.hours, { h: hours, m: rest })
      : format(copy.hoursOnly, { h: hours });
  }
  return minutes > 0 ? format(copy.minutes, { m: minutes }) : copy.underMinute;
}
