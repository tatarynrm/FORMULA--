'use client';

import { useState } from 'react';

import { PageHeader } from '@/components/common/page-header';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useNow } from '@/features/admin/hooks/use-now';
import { formatRelativeTime } from '@/lib/format';
import { cn } from '@/lib/utils';
import { t } from '@/locales';

import { useMyTestimonials } from '../hooks/use-testimonials';
import { RatingStars } from './rating-stars';
import { TestimonialForm } from './testimonial-form';

const STATUS_BADGE = {
  pending: 'bg-secondary text-primary',
  approved: 'bg-success-soft text-success',
  rejected: 'bg-muted text-muted-foreground',
} as const;

/** The student's page «Мій відгук»: write a testimonial and follow what happened to the earlier ones. */
export function FeedbackPage() {
  const copy = t.testimonials.feedbackPage;
  const mine = useMyTestimonials(true);
  const now = useNow();
  // Remounting the form after the "thank you" screen starts a fresh one (or the "waiting" note).
  const [formKey, setFormKey] = useState(0);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title={copy.title} description={copy.description} />

      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,22rem)]">
        <section className="bg-surface-soft border-border rounded-2xl border p-5 md:p-6">
          <TestimonialForm
            key={formKey}
            onDone={() => setFormKey((value) => value + 1)}
            loginNext="/cabinet/feedback"
          />
        </section>

        <section aria-labelledby="my-testimonials" className="flex flex-col gap-3">
          <h2 id="my-testimonials" className="text-h3 text-foreground">
            {copy.mineTitle}
          </h2>

          {mine.isPending ? (
            <Skeleton className="h-28 w-full rounded-2xl" />
          ) : mine.isError ? (
            <p role="alert" className="text-body-sm text-destructive">
              {copy.loadError}
            </p>
          ) : mine.data.length === 0 ? (
            <p className="text-body-md text-muted-foreground">{copy.none}</p>
          ) : (
            <ul className="flex flex-col gap-3">
              {mine.data.map((item) => (
                <li
                  key={item.id}
                  className="bg-surface-raised border-border flex flex-col gap-2 rounded-2xl border p-4"
                >
                  <div className="flex items-center justify-between gap-2">
                    <RatingStars value={item.rating} />
                    <Badge className={cn('border-transparent', STATUS_BADGE[item.status])}>
                      {copy.status[item.status]}
                    </Badge>
                  </div>
                  <p className="text-body-sm text-foreground line-clamp-4 break-words whitespace-pre-line">
                    {item.text}
                  </p>
                  <p className="text-body-xs text-muted-foreground">
                    {formatRelativeTime(item.createdAt, now)}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
