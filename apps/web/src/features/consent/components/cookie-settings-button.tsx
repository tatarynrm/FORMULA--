'use client';

import { t } from '@/locales';

import { openSettings } from '../consent-store';

/** A text button that opens the cookie settings: the footer has one, so the choice can be changed any time. */
export function CookieSettingsButton({ className }: { className?: string }) {
  return (
    <button type="button" onClick={openSettings} className={className}>
      {t.consent.settings.link}
    </button>
  );
}
