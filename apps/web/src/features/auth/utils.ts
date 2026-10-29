import { ERROR_CODES, type UserRole } from '@formula/shared';

import { ApiClientError } from '@/lib/api-client';
import { t } from '@/locales';

/** Landing page after sign-in when no `next` was requested. */
export function getHomePath(role: UserRole): string {
  return role === 'admin' ? '/admin' : '/cabinet';
}

/** The requested post-login path, only if it stays on this site (prevents open redirects). */
export function getSafeRedirect(next: string | null | undefined): string | undefined {
  if (next && next.startsWith('/') && !next.startsWith('//') && !next.startsWith('/\\')) {
    return next;
  }
  return undefined;
}

/** Maps an api error to a localized message for the auth forms. */
export function getAuthErrorMessage(error: unknown): string | null {
  if (!error) return null;
  if (!(error instanceof ApiClientError)) return t.auth.errors.generic;

  switch (error.code) {
    case ERROR_CODES.INVALID_CREDENTIALS:
      return t.auth.errors.invalidCredentials;
    case ERROR_CODES.EMAIL_TAKEN:
      return t.auth.errors.emailTaken;
    case ERROR_CODES.TOO_MANY_REQUESTS:
      return t.auth.errors.tooManyRequests;
    case ERROR_CODES.SERVICE_UNAVAILABLE:
      return t.errors.network;
    default:
      return t.auth.errors.generic;
  }
}
