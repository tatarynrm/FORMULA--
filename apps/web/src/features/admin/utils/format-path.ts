import { t } from '@/locales';

/**
 * "Біохімія › Гормони › Стероїдні гормони": where a test lives in the catalog. Parts that are
 * missing (a test outside the subjects, such as AMPS, has none) are left out; `null` when nothing
 * is known, so the caller can skip the line.
 */
export function formatContentPath(parts: readonly (string | null)[]): string | null {
  const known = parts.filter((part): part is string => Boolean(part));
  return known.length > 0 ? known.join(t.adminContent.reviews.pathSeparator) : null;
}
