import { AUTH_COOKIES } from '@formula/shared';

/** The cookie that remembers the visitor's choice. It is first-party, readable by scripts on purpose. */
export const CONSENT_COOKIE = 'formula_consent';

/**
 * Bump this when the catalog or what a category means changes in a way that visitors must confirm
 * again: everyone whose stored choice has another version is asked once more.
 */
export const CONSENT_VERSION = 1;

/** How long a choice is remembered (six months, the usual upper bound regulators recommend). */
export const CONSENT_MAX_AGE_DAYS = 180;

/** Categories that need a yes from the visitor before anything in them may run. */
export const OPTIONAL_CATEGORIES = ['analytics', 'marketing'] as const;

export type OptionalCategory = (typeof OPTIONAL_CATEGORIES)[number];
export type ConsentCategory = 'necessary' | OptionalCategory;

export interface CookieInfo {
  /** Name of the cookie or storage key. Purpose and duration live in `t.consent.cookies[id]`. */
  id: string;
  category: ConsentCategory;
  storage: 'cookie' | 'localStorage';
}

/**
 * Everything the site stores in the visitor's browser. Keep it truthful: this list is shown to
 * visitors and mirrored in the privacy policy (section "cookies").
 *
 * To add analytics or ads later: add the entries here (category `analytics` / `marketing`) with
 * their texts in `locales/consent.ts`, load the script inside `<ConsentGate category="analytics">`,
 * bump `CONSENT_VERSION`. The banner then switches from a notice to a real choice by itself.
 */
export const COOKIE_CATALOG: readonly CookieInfo[] = [
  { id: AUTH_COOKIES.ACCESS, category: 'necessary', storage: 'cookie' },
  { id: AUTH_COOKIES.REFRESH, category: 'necessary', storage: 'cookie' },
  // Set by the api only while a Google sign-in is in flight.
  { id: 'oauth_state', category: 'necessary', storage: 'cookie' },
  { id: CONSENT_COOKIE, category: 'necessary', storage: 'cookie' },
];

/** Optional categories that really contain something. Only those are shown and asked about. */
export const ACTIVE_OPTIONAL: readonly OptionalCategory[] = OPTIONAL_CATEGORIES.filter((category) =>
  COOKIE_CATALOG.some((item) => item.category === category),
);

/**
 * `notice`: only strictly necessary cookies exist, so there is nothing to choose and the banner
 * just informs (this is what the law asks for in that case). `choice`: there is something optional,
 * so the visitor gets accept / reject / customise with equal weight.
 */
export const CONSENT_MODE: 'notice' | 'choice' = ACTIVE_OPTIONAL.length > 0 ? 'choice' : 'notice';
