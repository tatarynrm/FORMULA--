import { ApiClientError } from '@/lib/api-client';
import { format } from '@/lib/format';
import { t } from '@/locales';

/** At most this many field messages of a 400 answer are appended to the text. */
const MAX_DETAILS = 3;

/**
 * Turns a failed api call into a Ukrainian sentence. `fallback` says what failed ("Не вдалося
 * зберегти тест"). For answers where the server explains the problem (400 validation, 409 conflict
 * such as publishing an invalid test) its English text is appended, because it names the exact
 * question or field. The api never sends text meant for students, so it is only shown to admins.
 */
export function describeApiError(error: unknown, fallback: string): string {
  const copy = t.adminContent.common;
  if (!(error instanceof ApiClientError)) return fallback;

  switch (error.statusCode) {
    case 0:
      return t.errors.network;
    case 403:
      return copy.forbidden;
    case 404:
      return `${fallback}. ${copy.gone}`;
    case 400:
    case 409: {
      const details = (error.details ?? [])
        .slice(0, MAX_DETAILS)
        .map((detail) => `${detail.field}: ${detail.message}`)
        .join('; ');
      const message = details || error.message;
      return message ? `${fallback}. ${format(copy.serverDetail, { message })}` : fallback;
    }
    default:
      return fallback;
  }
}

/** True for an api answer with this HTTP status, e.g. `isApiStatus(error, 404)`. */
export function isApiStatus(error: unknown, status: number): boolean {
  return error instanceof ApiClientError && error.statusCode === status;
}
