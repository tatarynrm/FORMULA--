'use client';

import type { NotificationItem } from '@formula/shared';

import { EmptyState } from '@/components/common/empty-state';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useNow } from '@/features/admin/hooks/use-now';
import { cn } from '@/lib/utils';
import { t } from '@/locales';

import { useMarkRead, useNotificationsList } from '../hooks/use-notifications';
import { NotificationRow } from './notification-item';

interface NotificationListProps {
  /** `compact` is the bell popover (no paging), `full` the feed page. */
  variant: 'compact' | 'full';
  limit?: number;
  unreadOnly?: boolean;
  /** `false` while the popover is closed, so nothing is fetched until it opens. */
  enabled?: boolean;
  /** Called after a row was clicked (the popover closes itself). */
  onNavigate?: () => void;
}

function ListSkeleton({ rows }: { rows: number }) {
  return (
    <div className="flex flex-col" aria-hidden>
      {Array.from({ length: rows }, (_, index) => (
        <div key={index} className="flex items-start gap-3 px-4 py-3">
          <Skeleton className="size-9 shrink-0 rounded-full" />
          <div className="flex flex-1 flex-col gap-2 py-1">
            <Skeleton className="h-3.5 w-2/3" />
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-3 w-1/4" />
          </div>
        </div>
      ))}
    </div>
  );
}

interface NoticeProps {
  compact: boolean;
  title: string;
  description?: string;
  action?: React.ReactNode;
}

/** Empty and error states: a plain paragraph in the popover, the dashed card on the page. */
function ListNotice({ compact, title, description, action }: NoticeProps) {
  if (!compact) return <EmptyState title={title} description={description} action={action} />;
  return (
    <div className="flex flex-col items-center gap-3 px-4 py-10 text-center">
      <p className="text-body-sm text-foreground font-semibold">{title}</p>
      {description ? <p className="text-body-xs text-muted-foreground">{description}</p> : null}
      {action}
    </div>
  );
}

/** The feed itself, shared by the bell popover and the full page. */
export function NotificationList({
  variant,
  limit,
  unreadOnly = false,
  enabled = true,
  onNavigate,
}: NotificationListProps) {
  const copy = t.notifications.list;
  const compact = variant === 'compact';
  const now = useNow();
  const list = useNotificationsList({ unreadOnly, limit, enabled });
  const markRead = useMarkRead();

  const open = (item: NotificationItem) => {
    if (item.readAt === null) markRead.mutate(item.id);
    onNavigate?.();
  };

  const loadMore = list.hasNextPage ? (
    <Button
      type="button"
      variant="secondary"
      size="sm"
      onClick={() => void list.fetchNextPage()}
      disabled={list.isFetchingNextPage}
    >
      {list.isFetchingNextPage ? copy.loadingMore : copy.loadMore}
    </Button>
  ) : null;

  if (list.isError) {
    return (
      <ListNotice
        compact={compact}
        title={copy.loadError}
        action={
          <Button type="button" variant="secondary" size="sm" onClick={() => void list.refetch()}>
            {copy.retry}
          </Button>
        }
      />
    );
  }

  if (list.isPending) return <ListSkeleton rows={compact ? 4 : 6} />;

  if (list.items.length === 0) {
    return (
      <ListNotice
        compact={compact}
        title={unreadOnly ? copy.emptyUnread : copy.empty}
        description={unreadOnly ? undefined : copy.emptyHint}
        // The unread filter narrows the loaded pages: more pages may still hold unread ones.
        action={compact ? undefined : loadMore}
      />
    );
  }

  return (
    <div className={cn('flex flex-col', compact ? 'gap-0' : 'gap-4')}>
      <ul
        className={cn(
          'divide-border flex flex-col divide-y',
          !compact && 'border-border bg-surface-raised overflow-hidden rounded-2xl border',
        )}
      >
        {list.items.map((item) => (
          <li key={item.id}>
            <NotificationRow item={item} now={now} onOpen={open} />
          </li>
        ))}
      </ul>
      {!compact && loadMore ? <div className="flex justify-center">{loadMore}</div> : null}
    </div>
  );
}
