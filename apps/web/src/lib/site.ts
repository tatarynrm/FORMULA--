import { t } from '@/locales';

import { env } from './env';

/** Canonical public origin, without a trailing slash. Set `NEXT_PUBLIC_SITE_URL` in production. */
export const SITE_URL = env.NEXT_PUBLIC_SITE_URL.replace(/\/$/, '');

export const SITE_NAME = t.brand.name;

/** Public pages that search engines should index. Everything else is `noindex` or disallowed. */
export const INDEXABLE_PATHS = ['/', '/privacy'] as const;

export function absoluteUrl(path = '/'): string {
  return `${SITE_URL}${path}`;
}
