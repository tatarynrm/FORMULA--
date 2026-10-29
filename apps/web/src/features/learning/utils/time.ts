import { format } from '@/lib/format';
import { t } from '@/locales';

/** `164` -> `02:44`, `3725` -> `1:02:05`. */
export function formatClock(totalSeconds: number): string {
  const safe = Math.max(0, Math.floor(totalSeconds));
  const hours = Math.floor(safe / 3600);
  const minutes = String(Math.floor((safe % 3600) / 60)).padStart(2, '0');
  const seconds = String(safe % 60).padStart(2, '0');
  return hours > 0 ? `${hours}:${minutes}:${seconds}` : `${minutes}:${seconds}`;
}

/**
 * How far the device clock is from the server clock, in ms: `Date.now() + offset` is the server time.
 * `serverNow` is the server's ISO time sent with the data, `receivedAtMs` the device time (ms) when it
 * arrived. The network delay (a few ms) is ignored. An unreadable `serverNow` means "no correction".
 */
export function clockOffsetMs(serverNow: string, receivedAtMs: number): number {
  const server = Date.parse(serverNow);
  return Number.isFinite(server) ? server - receivedAtMs : 0;
}

/** Whole seconds from `serverNowMs` to `deadlineAt` (ISO). Never negative; a started second counts as a whole one. */
export function secondsUntil(deadlineAt: string, serverNowMs: number): number {
  return Math.max(0, Math.ceil((Date.parse(deadlineAt) - serverNowMs) / 1000));
}

/** A time limit for people: `600` -> `10 хв`, `75` -> `1 хв 15 с`, `45` -> `45 с`. */
export function formatDuration(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  const parts: string[] = [];

  if (minutes > 0) parts.push(format(t.learning.common.minutes, { minutes }));
  if (seconds > 0 || minutes === 0) parts.push(format(t.learning.common.seconds, { seconds }));
  return parts.join(' ');
}

/** Seconds between the start and the end of an attempt, or `null` while it is still open. */
export function elapsedSeconds(startedAt: string, finishedAt: string | null): number | null {
  if (!finishedAt) return null;
  const elapsed = Date.parse(finishedAt) - Date.parse(startedAt);
  return Number.isFinite(elapsed) ? Math.max(0, Math.round(elapsed / 1000)) : null;
}

const DATE_TIME = new Intl.DateTimeFormat('uk-UA', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
});

export function formatDateTime(iso: string): string {
  return DATE_TIME.format(new Date(iso));
}
