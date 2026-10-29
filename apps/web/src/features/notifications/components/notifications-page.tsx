'use client';

import { useState } from 'react';

import { PageHeader } from '@/components/common/page-header';
import { SegmentedControl } from '@/components/common/segmented-control';
import { Button } from '@/components/ui/button';
import { t } from '@/locales';

import { useMarkAllRead, useNotificationSummary } from '../hooks/use-notifications';
import { NotificationList } from './notification-list';

type Filter = 'all' | 'unread';

/** The full feed (`/cabinet/notifications` for students, `/admin/inbox` for admins). */
export function NotificationsPage() {
  const copy = t.notifications.page;
  const [filter, setFilter] = useState<Filter>('all');
  const summary = useNotificationSummary();
  const markAll = useMarkAllRead();
  const unread = summary.data?.unread ?? 0;

  const filters = [
    { id: 'all', label: copy.filters.all },
    { id: 'unread', label: copy.filters.unread },
  ] as const;

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={copy.title}
        description={copy.description}
        action={
          <div className="flex md:justify-end">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => markAll.mutate()}
              disabled={unread === 0 || markAll.isPending}
            >
              {t.notifications.popover.markAllRead}
            </Button>
          </div>
        }
      />

      <SegmentedControl
        items={filters}
        value={filter}
        onValueChange={setFilter}
        label={copy.filterLabel}
        className="md:max-w-sm"
      />

      <NotificationList variant="full" unreadOnly={filter === 'unread'} />
    </div>
  );
}
