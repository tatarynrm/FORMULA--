import { format } from '@/lib/format';
import { t } from '@/locales';

/** `1800` -> "30 хв", `5400` -> "1 год 30 хв", `90` -> "1 хв 30 с", `null` -> "Без обмеження часу". */
export function formatTimeLimit(seconds: number | null): string {
  const copy = t.adminContent.tests;
  if (seconds === null) return copy.noLimit;

  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const rest = seconds % 60;

  const parts = [
    hours > 0 ? format(copy.hoursShort, { n: hours }) : null,
    minutes > 0 ? format(copy.minutes, { n: minutes }) : null,
    rest > 0 ? format(copy.secondsShort, { n: rest }) : null,
  ].filter((part): part is string => part !== null);

  return parts.length > 0 ? parts.join(' ') : format(copy.secondsShort, { n: 0 });
}
