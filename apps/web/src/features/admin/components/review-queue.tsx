'use client';

import type { ReviewListItem } from '@formula/shared';
import Link from 'next/link';
import { useId, useState } from 'react';

import { EmptyState } from '@/components/common/empty-state';
import { LogoLoader } from '@/components/common/logo-loader';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { buttonVariants } from '@/components/ui/button';
import { format } from '@/lib/format';
import { cn } from '@/lib/utils';
import { t } from '@/locales';

import { useReviewQueue } from '../hooks/use-reviews';
import { formatDateTime } from '../utils/format-date';
import { formatContentPath } from '../utils/format-path';
import { AdminPageHeader } from './admin-page-header';

interface ReviewTableProps {
  items: ReviewListItem[];
  reviewed: boolean;
}

function ReviewTable({ items, reviewed }: ReviewTableProps) {
  const copy = t.adminContent.reviews;
  const action = reviewed ? copy.openReviewed : copy.openPending;

  return (
    <div className="bg-surface-raised border-input relative overflow-x-auto rounded-3xl border">
      <table className="w-full min-w-200 text-left">
        <thead>
          <tr className="text-body-sm text-muted-foreground border-border border-b">
            <th scope="col" className="px-4 py-4 font-medium">
              {copy.columns.student}
            </th>
            <th scope="col" className="px-4 py-4 font-medium">
              {copy.columns.test}
            </th>
            <th scope="col" className="px-4 py-4 font-medium">
              {copy.columns.finished}
            </th>
            <th scope="col" className="px-4 py-4 font-medium">
              {copy.columns.status}
            </th>
            <th scope="col" className="px-4 py-4">
              <span className="sr-only">{action}</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => {
            // The situational tests of all subtopics share a name, so the place tells them apart.
            const path = formatContentPath([
              item.subjectTitle,
              item.topicTitle,
              item.subtopicTitle,
            ]);

            return (
              <tr
                key={item.attemptId}
                className="border-border text-body-md text-foreground border-b last:border-b-0"
              >
                <td className="min-w-44 px-4 py-4">
                  <p className="font-semibold">{item.studentName}</p>
                  <p className="text-body-sm text-text-secondary">{item.studentEmail}</p>
                </td>
                <td className="min-w-48 px-4 py-4 break-words">
                  <p>{item.testTitle}</p>
                  {path ? <p className="text-body-xs text-muted-foreground">{path}</p> : null}
                </td>
                <td className="text-text-secondary px-4 py-4">{formatDateTime(item.finishedAt)}</td>
                <td className="px-4 py-4">
                  <span
                    className={cn(
                      'text-body-sm inline-flex items-center rounded-full border px-4 py-1.5 font-medium whitespace-nowrap',
                      item.status === 'reviewed'
                        ? 'border-success bg-success-soft text-success'
                        : 'border-primary text-primary',
                    )}
                  >
                    {copy.statuses[item.status]}
                  </span>
                </td>
                <td className="px-4 py-4 text-right">
                  <Link
                    href={`/admin/reviews/${item.attemptId}`}
                    aria-label={format(copy.openFor, {
                      action,
                      student: item.studentName,
                      test: path ? `${item.testTitle} (${path})` : item.testTitle,
                    })}
                    className={buttonVariants({
                      variant: reviewed ? 'secondary' : 'default',
                      size: 'sm',
                    })}
                  >
                    {action}
                  </Link>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

/** Queue of written answers waiting for a grade, with a switch to also list the ones already graded. */
export function ReviewQueue() {
  const copy = t.adminContent.reviews;
  const switchId = useId();
  const [showReviewed, setShowReviewed] = useState(false);
  const pending = useReviewQueue('pending_review');
  const reviewed = useReviewQueue('reviewed', showReviewed);

  return (
    <div className="flex flex-col gap-6">
      <AdminPageHeader title={copy.pageTitle} />
      <p className="text-body-md text-text-secondary">{copy.intro}</p>

      <div className="flex flex-col gap-3">
        <h2 className="text-h3 text-foreground">{copy.pendingTitle}</h2>
        {pending.isError ? (
          <EmptyState title={copy.loadError} />
        ) : pending.isPending ? (
          <LogoLoader size="lg" className="py-12" />
        ) : pending.data.length === 0 ? (
          <EmptyState title={copy.emptyPending} description={copy.emptyPendingHint} />
        ) : (
          <ReviewTable items={pending.data} reviewed={false} />
        )}
      </div>

      <div className="flex items-center gap-3">
        <Switch id={switchId} checked={showReviewed} onCheckedChange={setShowReviewed} />
        <Label htmlFor={switchId}>{copy.showReviewed}</Label>
      </div>

      {showReviewed ? (
        <div className="flex flex-col gap-3">
          <h2 className="text-h3 text-foreground">{copy.reviewedTitle}</h2>
          {reviewed.isError ? (
            <EmptyState title={copy.loadError} />
          ) : reviewed.isPending ? (
            <LogoLoader size="lg" className="py-12" />
          ) : reviewed.data.length === 0 ? (
            <EmptyState title={copy.emptyReviewed} />
          ) : (
            <ReviewTable items={reviewed.data} reviewed />
          )}
        </div>
      ) : null}
    </div>
  );
}
