import { authApi } from '@/features/auth/api/auth-api';

/**
 * Files (images, video, downloads) are fetched by the browser itself with the session cookie, which may
 * have expired while the page stayed open. Asking the api for the current user renews the cookie when
 * needed, so the file request that follows works again.
 */
export async function ensureFreshSession(): Promise<void> {
  try {
    await authApi.me();
  } catch {
    // Nothing to do here: the file request that follows reports its own failure.
  }
}
