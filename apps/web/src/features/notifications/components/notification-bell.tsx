'use client';

import { Bell } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useCurrentUser } from '@/features/auth/hooks/use-current-user';
import { format, pluralizeUk } from '@/lib/format';
import { cn } from '@/lib/utils';
import { t } from '@/locales';

import {
  useMarkAllRead,
  useNotificationSummary,
  useNotificationsRealtime,
} from '../hooks/use-notifications';
import { useUnreadTitle } from '../hooks/use-unread-title';
import { formatBadge } from '../utils/notification-meta';
import { NotificationList } from './notification-list';

/** How many of the latest notifications the popover shows; the rest is on the feed page. */
const POPOVER_LIMIT = 8;

interface NotificationBellProps {
  className?: string;
}

/**
 * The bell with the unread badge and its popover. Also the one place that wires the live stream
 * into the notification caches and mirrors the unread count into the document title.
 */
export function NotificationBell({ className }: NotificationBellProps) {
  const copy = t.notifications;
  const { data: user } = useCurrentUser();
  const isAdmin = user?.role === 'admin';
  const [open, setOpen] = useState(false);
  const summary = useNotificationSummary();
  const markAll = useMarkAllRead();
  useNotificationsRealtime();

  const unread = summary.data?.unread ?? 0;
  const badge = formatBadge(unread, copy.bell.overflow);
  useUnreadTitle(unread, badge);

  const label =
    unread > 0
      ? format(copy.bell.unreadLabel, {
          count: unread,
          noun: pluralizeUk(unread, copy.bell.unreadForms),
        })
      : copy.bell.label;

  const feedHref = isAdmin ? '/admin/inbox' : '/cabinet/notifications';
  const pendingReviews = summary.data?.pendingReviews ?? 0;
  const unreadChats = summary.data?.unreadChats ?? 0;
  const queues = isAdmin
    ? [
        pendingReviews > 0
          ? {
              href: '/admin/reviews',
              label: format(copy.popover.pendingReviews, { count: pendingReviews }),
            }
          : null,
        unreadChats > 0
          ? {
              href: '/admin/support',
              label: format(copy.popover.unreadChats, { count: unreadChats }),
            }
          : null,
      ].filter((queue) => queue !== null)
    : [];

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label={label}
          className={cn('text-foreground relative', className)}
        >
          <Bell className="size-5.5" />
          {unread > 0 ? (
            <span
              aria-hidden
              className="bg-primary text-primary-foreground absolute -top-0.5 -right-0.5 flex h-5 min-w-5 items-center justify-center rounded-full px-1 text-xs leading-none font-bold"
            >
              {badge}
            </span>
          ) : null}
        </Button>
      </PopoverTrigger>

      <PopoverContent
        align="end"
        sideOffset={8}
        collisionPadding={16}
        className="w-96 max-w-[calc(100vw-2rem)] overflow-hidden rounded-2xl p-0"
      >
        <div className="flex items-center justify-between gap-3 px-4 py-3">
          <h2 className="text-body-md text-foreground font-bold">{copy.popover.title}</h2>
          <button
            type="button"
            onClick={() => markAll.mutate()}
            disabled={unread === 0 || markAll.isPending}
            className="text-body-xs text-primary font-semibold hover:underline disabled:cursor-default disabled:opacity-50 disabled:hover:no-underline"
          >
            {copy.popover.markAllRead}
          </button>
        </div>

        {queues.length > 0 ? (
          <div className="flex flex-wrap gap-2 px-4 pb-3">
            {queues.map((queue) => (
              <Link
                key={queue.href}
                href={queue.href}
                onClick={() => setOpen(false)}
                className="bg-secondary text-primary text-body-xs hover:bg-accent rounded-full px-3 py-1 font-semibold transition-colors"
              >
                {queue.label}
              </Link>
            ))}
          </div>
        ) : null}

        <div className="border-border max-h-[min(28rem,60dvh)] overflow-y-auto border-t">
          <NotificationList
            variant="compact"
            limit={POPOVER_LIMIT}
            enabled={open}
            onNavigate={() => setOpen(false)}
          />
        </div>

        <div className="border-border border-t px-4 py-3 text-center">
          <Link
            href={feedHref}
            onClick={() => setOpen(false)}
            className="text-body-sm text-primary font-semibold hover:underline"
          >
            {copy.popover.viewAll}
          </Link>
        </div>
      </PopoverContent>
    </Popover>
  );
}
