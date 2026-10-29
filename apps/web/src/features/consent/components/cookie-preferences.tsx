'use client';

import { ChevronDown } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { format } from '@/lib/format';
import { t } from '@/locales';

import { ACTIVE_OPTIONAL, COOKIE_CATALOG, type ConsentCategory } from '../constants';
import { useConsent } from '../hooks/use-consent';

const CATEGORIES: readonly ConsentCategory[] = ['necessary', ...ACTIVE_OPTIONAL];

/** What is stored for one category: name, kind, purpose and how long it lives. */
function CookieList({ category }: { category: ConsentCategory }) {
  const copy = t.consent.settings;
  const items = COOKIE_CATALOG.filter((item) => item.category === category);

  return (
    <details className="group">
      <summary className="text-primary text-body-sm flex cursor-pointer list-none items-center gap-1 font-semibold [&::-webkit-details-marker]:hidden">
        {format(copy.showList, { count: items.length })}
        <ChevronDown className="size-4 transition-transform group-open:rotate-180" aria-hidden />
      </summary>
      <ul className="mt-3 flex flex-col gap-2.5">
        {items.map((item) => {
          const text = t.consent.cookies[item.id];
          return (
            <li key={item.id} className="bg-secondary flex flex-col gap-1 rounded-xl p-3">
              <p className="text-body-sm text-foreground flex flex-wrap items-center gap-x-2 font-semibold">
                <code className="break-all">{item.id}</code>
                <span className="text-muted-foreground text-body-xs font-medium">
                  {copy.type}: {copy.storage[item.storage]}
                </span>
              </p>
              {text ? (
                <>
                  <p className="text-body-xs text-text-secondary">{text.purpose}</p>
                  <p className="text-body-xs text-muted-foreground">
                    {copy.duration}: {text.duration}
                  </p>
                </>
              ) : null}
            </li>
          );
        })}
      </ul>
    </details>
  );
}

/** The categories with their switches. Mounted only while the dialog is open, so the draft starts fresh. */
function PreferencesBody() {
  const { mode, decided, record, acceptAll, rejectOptional, save, closeSettings } = useConsent();
  const copy = t.consent.settings;
  const [draft, setDraft] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(ACTIVE_OPTIONAL.map((category) => [category, record?.c[category] === true])),
  );

  return (
    <>
      <DialogHeader className="gap-2 text-left">
        <DialogTitle className="text-h3 text-foreground">{copy.title}</DialogTitle>
        <DialogDescription className="text-body-sm text-text-secondary">
          {mode === 'notice' ? copy.noticeIntro : copy.choiceIntro}
        </DialogDescription>
      </DialogHeader>

      <div className="flex flex-col gap-3 text-left">
        {CATEGORIES.map((category) => {
          const text = t.consent.categories[category];
          return (
            <section
              key={category}
              className="border-border flex flex-col gap-3 rounded-2xl border p-4"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex flex-col gap-1">
                  <h3 className="text-body-md text-foreground font-bold">{text.title}</h3>
                  <p className="text-body-sm text-text-secondary">{text.description}</p>
                </div>
                {category === 'necessary' ? (
                  <span className="bg-secondary text-primary text-body-xs shrink-0 rounded-full px-3 py-1 font-semibold">
                    {copy.alwaysOn}
                  </span>
                ) : (
                  <Switch
                    aria-label={text.title}
                    checked={draft[category] === true}
                    onCheckedChange={(checked) =>
                      setDraft((current) => ({ ...current, [category]: checked }))
                    }
                  />
                )}
              </div>
              <CookieList category={category} />
            </section>
          );
        })}
      </div>

      <Link
        href="/privacy#cookies"
        onClick={closeSettings}
        className="text-primary text-body-sm text-left font-semibold hover:underline"
      >
        {copy.privacy}
      </Link>

      <DialogFooter className="gap-2 sm:justify-start">
        {mode === 'notice' ? (
          <>
            {decided ? null : <Button onClick={acceptAll}>{t.consent.banner.understood}</Button>}
            <Button variant="secondary" onClick={closeSettings}>
              {copy.close}
            </Button>
          </>
        ) : (
          <>
            <Button onClick={() => save(draft)}>{copy.save}</Button>
            <Button variant="secondary" onClick={acceptAll}>
              {t.consent.banner.acceptAll}
            </Button>
            <Button variant="secondary" onClick={rejectOptional}>
              {t.consent.banner.necessaryOnly}
            </Button>
          </>
        )}
      </DialogFooter>
    </>
  );
}

/** "Cookie settings": the full list and, when there is something optional, the switches. */
export function CookiePreferences() {
  const { settingsOpen, closeSettings } = useConsent();

  return (
    <Dialog open={settingsOpen} onOpenChange={(open) => !open && closeSettings()}>
      <DialogContent className="scrollbar-brand max-w-xl gap-5">
        <PreferencesBody />
      </DialogContent>
    </Dialog>
  );
}
