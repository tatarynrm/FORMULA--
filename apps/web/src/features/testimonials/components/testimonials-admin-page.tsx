'use client';

import type { TestimonialStatus } from '@formula/shared';
import { Loader2 } from 'lucide-react';
import { useState } from 'react';

import { EmptyState } from '@/components/common/empty-state';
import { PageHeader } from '@/components/common/page-header';
import { SegmentedControl } from '@/components/common/segmented-control';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useNow } from '@/features/admin/hooks/use-now';
import { t } from '@/locales';

import {
  useAdminTestimonials,
  useModerationRealtime,
  useTestimonialCounts,
} from '../hooks/use-testimonials';
import { AdminTestimonialCard } from './admin-testimonial-card';

const STATUSES: readonly TestimonialStatus[] = ['pending', 'approved', 'rejected'];

/** Moderation: the testimonials by state, with the number of each waiting on the tab. */
export function TestimonialsAdminPage() {
  const copy = t.testimonials.admin;
  const [status, setStatus] = useState<TestimonialStatus>('pending');
  const list = useAdminTestimonials(status);
  const counts = useTestimonialCounts();
  const now = useNow();
  useModerationRealtime();

  const items = list.data?.pages.flatMap((page) => page.items) ?? [];
  const tabs = STATUSES.map((id) => ({
    id,
    label: counts.data ? `${copy.tabs[id]} (${counts.data[id]})` : copy.tabs[id],
  }));

  const emptyTitle = copy.empty[status];
  const emptyHint = status === 'pending' ? copy.empty.pendingHint : undefined;

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title={copy.title} description={copy.description} />

      <SegmentedControl
        label={copy.filterLabel}
        items={tabs}
        value={status}
        onValueChange={setStatus}
        className="max-w-xl"
      />

      {list.isPending ? (
        <div role="status" aria-label={t.common.loading} className="flex flex-col gap-4">
          {Array.from({ length: 3 }, (_, index) => (
            <Skeleton key={index} className="h-40 w-full rounded-2xl" />
          ))}
        </div>
      ) : list.isError ? (
        <div role="alert">
          <EmptyState
            title={copy.loadError}
            action={
              <Button type="button" variant="secondary" onClick={() => void list.refetch()}>
                {copy.retry}
              </Button>
            }
          />
        </div>
      ) : items.length === 0 ? (
        <EmptyState title={emptyTitle} description={emptyHint} />
      ) : (
        <>
          <ul className="grid gap-4 xl:grid-cols-2">
            {items.map((testimonial) => (
              <li key={testimonial.id} className="flex">
                <div className="flex-1">
                  <AdminTestimonialCard testimonial={testimonial} now={now} />
                </div>
              </li>
            ))}
          </ul>
          {list.hasNextPage ? (
            <Button
              type="button"
              variant="secondary"
              className="self-center"
              disabled={list.isFetchingNextPage}
              onClick={() => void list.fetchNextPage()}
            >
              {list.isFetchingNextPage ? <Loader2 className="animate-spin" /> : null}
              {copy.loadMore}
            </Button>
          ) : null}
        </>
      )}
    </div>
  );
}
