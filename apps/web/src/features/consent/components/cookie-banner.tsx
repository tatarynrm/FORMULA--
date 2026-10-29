'use client';

import { Cookie } from 'lucide-react';
import Link from 'next/link';
import { useId } from 'react';

import { Button } from '@/components/ui/button';
import { t } from '@/locales';

import { useConsent } from '../hooks/use-consent';

/**
 * The first-visit notice at the bottom of the screen. It never blocks the page and never steals
 * focus. With only necessary cookies it informs (`notice`); once something optional exists it asks
 * with "accept" and "necessary only" side by side, equally easy to press (`choice`).
 */
export function CookieBanner() {
  const { ready, decided, settingsOpen, mode, acceptAll, rejectOptional, openSettings } =
    useConsent();
  const titleId = useId();
  const textId = useId();

  // `ready` is false on the server and while hydrating, so people who already chose never see a flash.
  if (!ready || decided || settingsOpen) return null;

  const copy = t.consent.banner;
  const notice = mode === 'notice';

  return (
    <div
      role="dialog"
      aria-modal="false"
      aria-label={copy.region}
      aria-labelledby={titleId}
      aria-describedby={textId}
      className="bg-card border-border motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-4 fixed inset-x-4 bottom-4 z-40 flex flex-col gap-4 rounded-2xl border p-5 shadow-lg motion-safe:duration-500 sm:right-auto sm:bottom-6 sm:left-6 sm:max-w-md"
    >
      <div className="flex items-start gap-3">
        <span className="bg-secondary text-primary flex size-10 shrink-0 items-center justify-center rounded-full">
          <Cookie className="size-5" aria-hidden />
        </span>
        <div className="flex flex-col gap-1.5">
          <p id={titleId} className="text-body-md text-foreground font-bold">
            {copy.title}
          </p>
          <p id={textId} className="text-body-sm text-text-secondary">
            {notice ? copy.noticeText : copy.choiceText}{' '}
            <Link href="/privacy#cookies" className="text-primary font-semibold hover:underline">
              {copy.privacy}
            </Link>
          </p>
        </div>
      </div>

      {notice ? (
        <div className="flex flex-col gap-2 sm:flex-row">
          <Button size="sm" className="flex-1" onClick={acceptAll}>
            {copy.understood}
          </Button>
          <Button size="sm" variant="secondary" className="flex-1" onClick={openSettings}>
            {copy.details}
          </Button>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          <div className="flex flex-col gap-2 sm:flex-row">
            <Button size="sm" className="flex-1" onClick={acceptAll}>
              {copy.acceptAll}
            </Button>
            <Button size="sm" variant="secondary" className="flex-1" onClick={rejectOptional}>
              {copy.necessaryOnly}
            </Button>
          </div>
          <Button size="sm" variant="ghost" onClick={openSettings}>
            {copy.customize}
          </Button>
        </div>
      )}
    </div>
  );
}
