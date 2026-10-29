'use client';

import type { NotificationItem } from '@formula/shared';
import Link from 'next/link';
import type { ReactNode } from 'react';

import { formatRelativeTime } from '@/lib/format';
import { cn } from '@/lib/utils';
import { t } from '@/locales';

import { getNotificationMeta } from '../utils/notification-meta';

interface NotificationRowProps {
  item: NotificationItem;
  /** Current time, from a ticking clock, for "5 хв тому". */
  now: number;
  /** Called on click, before the browser follows `item.link` (if there is one). */
  onOpen: (item: NotificationItem) => void;
}

/** One row of the feed: type icon, title, two lines of body, relative time, unread dot. */
export function NotificationRow({ item, now, onOpen }: NotificationRowProps) {
  const { icon: Icon, accent } = getNotificationMeta(item.type);
  const unread = item.readAt === null;
  const typeLabel = (t.notifications.types as Record<string, string | undefined>)[item.type];

  const className = cn(
    'flex w-full items-start gap-3 px-4 py-3 text-left transition-colors outline-none',
    'hover:bg-accent focus-visible:bg-accent',
    unread && 'bg-secondary/60',
  );

  const content: ReactNode = (
    <>
      <span
        className={cn('flex size-9 shrink-0 items-center justify-center rounded-full', accent)}
        role="img"
        aria-label={typeLabel}
      >
        <Icon className="size-4.5" aria-hidden />
      </span>
      <span className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span
          className={cn(
            'text-body-sm text-foreground line-clamp-1 break-words',
            unread ? 'font-bold' : 'font-semibold',
          )}
        >
          {item.title}
        </span>
        {item.body ? (
          <span className="text-body-xs text-text-secondary line-clamp-2 break-words">
            {item.body}
          </span>
        ) : null}
        <time dateTime={item.createdAt} className="text-body-xs text-muted-foreground">
          {formatRelativeTime(item.createdAt, now)}
        </time>
      </span>
      {unread ? (
        <span
          role="img"
          aria-label={t.notifications.list.unread}
          className="bg-primary mt-2 size-2 shrink-0 rounded-full"
        />
      ) : null}
    </>
  );

  if (item.link) {
    return (
      <Link href={item.link} onClick={() => onOpen(item)} className={className}>
        {content}
      </Link>
    );
  }

  // Nowhere to go: a click only marks it read, so an already read row is plain text.
  if (!unread) return <div className={className}>{content}</div>;

  return (
    <button type="button" onClick={() => onOpen(item)} className={className}>
      {content}
    </button>
  );
}
