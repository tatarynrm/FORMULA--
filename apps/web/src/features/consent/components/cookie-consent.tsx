'use client';

import { CookieBanner } from './cookie-banner';
import { CookiePreferences } from './cookie-preferences';

/** Mounted once for the whole app (providers): the notice and the settings dialog it opens. */
export function CookieConsent() {
  return (
    <>
      <CookieBanner />
      <CookiePreferences />
    </>
  );
}
