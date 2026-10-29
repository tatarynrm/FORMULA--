'use client';

import type { NotificationItem } from '@formula/shared';
import { Layers, LockOpen, PartyPopper } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { type CSSProperties, useId, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';
import { format } from '@/lib/format';
import { t } from '@/locales';

import { useMarkRead, useNotificationsList } from '../hooks/use-notifications';

/** A timed test is running: the celebration waits until the student leaves it (the bell still lights up). */
const ATTEMPT_IN_PROGRESS = /^\/cabinet\/attempts\/[^/]+\/?$/;

/** How many names the "several modules at once" list shows before it says "and N more". */
const LISTED_NAMES = 4;

const CONFETTI_TONES = [
  'bg-primary',
  'bg-accent-blue',
  'bg-success',
  'bg-primary/55',
  'bg-accent-blue/55',
] as const;

// A fixed burst (golden-angle spread, no randomness), so every render and every student sees the
// same pretty picture and the component stays pure.
const CONFETTI = Array.from({ length: 28 }, (_, index) => {
  const angle = index * 2.399963;
  const reach = 64 + ((index * 37) % 72);
  return {
    x: Math.round(Math.cos(angle) * reach),
    y: Math.round(Math.sin(angle) * reach * 0.75) - 24,
    r: ((index * 97) % 640) - 320,
    delay: (index % 7) * 28,
    tone: CONFETTI_TONES[index % CONFETTI_TONES.length],
    long: index % 3 === 0,
  };
});

const SPARKLES = [
  { left: '8%', top: '22%', size: 18, delay: 1.1 },
  { left: '84%', top: '16%', size: 22, delay: 1.35 },
  { left: '92%', top: '58%', size: 14, delay: 1.6 },
  { left: '2%', top: '64%', size: 14, delay: 1.5 },
  { left: '70%', top: '88%', size: 16, delay: 1.25 },
  { left: '24%', top: '90%', size: 12, delay: 1.75 },
];

/** A subject is one module; subtopics come as a list, one notification per admin action. */
function countModules(item: NotificationItem): { kind: 'subject' | 'subtopics'; modules: number } {
  const subtopicIds = item.data.subtopicIds;
  return Array.isArray(subtopicIds)
    ? { kind: 'subtopics', modules: subtopicIds.length }
    : { kind: 'subject', modules: 1 };
}

function headingFor(batch: readonly NotificationItem[]): string {
  const copy = t.notifications.unlock;
  const [only] = batch;
  if (batch.length === 1 && only) {
    const { kind, modules } = countModules(only);
    if (kind === 'subject') return copy.subject;
    return modules === 1 ? copy.subtopic : format(copy.subtopics, { count: modules });
  }
  const total = batch.reduce((sum, item) => sum + countModules(item).modules, 0);
  return format(copy.many, { count: total });
}

/** The padlock: it shakes, then the shackle springs open (see `.unlock-*` in globals.css). */
function OpenLock() {
  const gradientId = useId();

  return (
    <svg
      viewBox="0 0 120 150"
      aria-hidden
      className="unlock-lock relative h-36 w-auto drop-shadow-lg"
    >
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" style={{ stopColor: 'var(--primary)' }} />
          <stop offset="1" style={{ stopColor: 'var(--accent-blue)' }} />
        </linearGradient>
      </defs>
      <path
        className="unlock-shackle stroke-accent-blue"
        d="M40 68 V46 a20 20 0 0 1 40 0 V68"
        fill="none"
        strokeWidth="9"
        strokeLinecap="round"
      />
      <rect x="20" y="64" width="80" height="68" rx="18" fill={`url(#${gradientId})`} />
      <circle cx="60" cy="92" r="8" className="fill-primary-foreground" />
      <rect x="56" y="96" width="8" height="18" rx="4" className="fill-primary-foreground" />
    </svg>
  );
}

/** The picture above the text: glow, rings, the lock, sparkles and the confetti burst. */
function Stage() {
  return (
    <div
      aria-hidden
      className="from-primary/15 relative isolate -mx-6 -mt-6 flex h-56 w-[calc(100%+3rem)] items-center justify-center bg-linear-to-b to-transparent"
    >
      <div className="bg-primary/20 absolute size-36 rounded-full blur-2xl" />
      {[1, 1.25].map((delay) => (
        <div
          key={delay}
          className="unlock-ring border-primary/50 absolute size-40 rounded-full border-2"
          style={{ '--d': `${delay}s` } as CSSProperties}
        />
      ))}

      <OpenLock />

      {SPARKLES.map((sparkle) => (
        <svg
          key={sparkle.left}
          viewBox="0 0 24 24"
          className="unlock-sparkle fill-primary absolute"
          style={
            {
              left: sparkle.left,
              top: sparkle.top,
              width: sparkle.size,
              height: sparkle.size,
              '--d': `${sparkle.delay}s`,
            } as CSSProperties
          }
        >
          <path d="M12 0C13 7 17 11 24 12 17 13 13 17 12 24 11 17 7 13 0 12 7 11 11 7 12 0Z" />
        </svg>
      ))}

      <div className="absolute top-1/2 left-1/2">
        {CONFETTI.map((piece, index) => (
          <span
            key={index}
            className={`unlock-confetti absolute rounded-[2px] ${piece.tone} ${piece.long ? 'h-3.5 w-1.5' : 'size-2'}`}
            style={
              {
                '--x': `${piece.x}px`,
                '--y': `${piece.y}px`,
                '--r': `${piece.r}deg`,
                '--d': `${piece.delay}ms`,
              } as CSSProperties
            }
          />
        ))}
      </div>
    </div>
  );
}

/** Text that rises in after the lock has opened; `delay` keeps the order of the lines. */
function rise(delay: number): CSSProperties {
  return { '--d': `${delay}s` } as CSSProperties;
}

/**
 * A celebration for the student when an admin opens a subject or subtopics for them, wherever in
 * the cabinet they are. It is driven by the same unread `access_granted` notifications the bell
 * shows (the live stream puts a new one into that cache the moment it is sent), so it also plays
 * once for anything that was opened while the student was away. Closing it marks them read.
 * Several at once become one dialog. During a timed test it waits for the test to end.
 */
export function AccessUnlockDialog() {
  const pathname = usePathname();
  const unread = useNotificationsList({ unreadOnly: true });
  const markRead = useMarkRead();
  const copy = t.notifications.unlock;

  // Ids already shown in this visit: a failed "mark read" must not bring the dialog back.
  const [handled, setHandled] = useState<ReadonlySet<string>>(() => new Set());
  const pending = unread.items.filter(
    (item) => item.type === 'access_granted' && item.readAt === null && !handled.has(item.id),
  );

  // The dialog keeps showing the last batch while it fades out, after `pending` is already empty.
  const [shown, setShown] = useState<readonly NotificationItem[]>([]);
  const [shownKey, setShownKey] = useState('');
  const pendingKey = pending.map((item) => item.id).join(',');
  if (pendingKey !== '' && pendingKey !== shownKey) {
    setShownKey(pendingKey);
    setShown(pending);
  }

  const open = pending.length > 0 && !ATTEMPT_IN_PROGRESS.test(pathname);

  const dismiss = () => {
    for (const item of pending) markRead.mutate(item.id);
    setHandled((current) => new Set([...current, ...pending.map((item) => item.id)]));
  };

  const [first] = shown;
  if (!first) return null;
  const single = shown.length === 1;
  const link = single ? (first.link ?? '/cabinet') : '/cabinet';
  const NameIcon = countModules(first).kind === 'subject' ? Layers : LockOpen;
  const listed = shown.slice(0, LISTED_NAMES);
  const hidden = shown.length - listed.length;

  return (
    <Dialog open={open} onOpenChange={(next) => !next && dismiss()}>
      <DialogContent className="max-w-md items-center gap-5 overflow-x-hidden text-center">
        <Stage />

        <span
          className="unlock-rise bg-secondary text-primary text-body-xs inline-flex items-center gap-1.5 rounded-full px-3 py-1 font-semibold"
          style={rise(1.05)}
        >
          <PartyPopper className="size-4" aria-hidden />
          {copy.eyebrow}
        </span>

        <DialogTitle className="unlock-rise text-h3 text-foreground" style={rise(1.2)}>
          {headingFor(shown)}
        </DialogTitle>

        {single ? (
          <div
            className="unlock-rise bg-secondary text-body-md text-foreground flex max-w-full items-center gap-2.5 rounded-2xl px-4 py-3 font-semibold"
            style={rise(1.35)}
          >
            <NameIcon className="text-primary size-5 shrink-0" aria-hidden />
            <span className="min-w-0 break-words">{first.body}</span>
          </div>
        ) : (
          <ul
            className="unlock-rise bg-secondary text-body-md text-foreground flex w-full flex-col gap-2 rounded-2xl px-4 py-3 text-left font-semibold"
            style={rise(1.35)}
          >
            {listed.map((item) => (
              <li key={item.id} className="flex items-center gap-2.5">
                <LockOpen className="text-primary size-5 shrink-0" aria-hidden />
                <span className="min-w-0 break-words">{item.body}</span>
              </li>
            ))}
            {hidden > 0 ? (
              <li className="text-text-secondary text-body-sm pl-7.5 font-medium">
                {format(copy.more, { count: hidden })}
              </li>
            ) : null}
          </ul>
        )}

        <DialogDescription
          className="unlock-rise text-body-sm text-text-secondary"
          style={rise(1.5)}
        >
          {copy.hint}
        </DialogDescription>

        <div className="unlock-rise flex w-full flex-col gap-3 sm:flex-row" style={rise(1.65)}>
          <Button asChild className="flex-1">
            <Link href={link} onClick={dismiss}>
              {copy.open}
            </Link>
          </Button>
          <Button type="button" variant="secondary" className="flex-1" onClick={dismiss}>
            {copy.later}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
