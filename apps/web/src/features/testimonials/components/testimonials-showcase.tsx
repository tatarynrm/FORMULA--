'use client';

import { ScrollCarousel } from '@/components/common/scroll-carousel';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { t } from '@/locales';

import { usePublicTestimonials } from '../hooks/use-testimonials';
import { TestimonialCard } from './testimonial-card';

/** Cards stacked in one scroll column. The number of columns follows from the number of testimonials. */
const CARDS_PER_COLUMN = 2;

/** The heading of the block when there is no carousel to carry it. */
function Heading({ title }: { title: string }) {
  return <h2 className="text-h2 text-foreground">{title}</h2>;
}

/**
 * The published testimonials of the landing page, in columns of stacked cards that scroll
 * sideways. Loaded in the browser, so a new approval shows up without rebuilding the page.
 */
export function TestimonialsShowcase({ title }: { title: string }) {
  const copy = t.testimonials.section;
  const query = usePublicTestimonials();

  if (query.isPending) {
    return (
      <div className="flex flex-col gap-10" role="status" aria-label={t.common.loading}>
        <Heading title={title} />
        <div className="grid gap-6 md:grid-cols-3">
          {Array.from({ length: 3 }, (_, index) => (
            <Skeleton key={index} className="h-44 w-full rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  if (query.isError) {
    return (
      <div role="alert" className="flex flex-col items-start gap-4">
        <Heading title={title} />
        <p className="text-body-md text-muted-foreground">{copy.loadError}</p>
        <Button type="button" variant="secondary" onClick={() => void query.refetch()}>
          {copy.retry}
        </Button>
      </div>
    );
  }

  const items = query.data;
  if (items.length === 0) {
    return (
      <div className="flex flex-col gap-3">
        <Heading title={title} />
        <p className="text-h3 text-foreground">{copy.empty}</p>
        <p className="text-body-md text-text-secondary">{copy.emptyHint}</p>
      </div>
    );
  }

  // Masonry look from Figma: columns of stacked cards.
  const columnCount = Math.ceil(items.length / CARDS_PER_COLUMN);
  const columns = Array.from({ length: columnCount }, (_, column) =>
    items.filter((_, index) => index % columnCount === column),
  );

  return (
    <ScrollCarousel
      title={title}
      className="gap-6"
      columnsClassName="items-start auto-cols-[85%] sm:auto-cols-[calc(50%-0.75rem)] lg:auto-cols-[calc((100%-3rem)/3)]"
    >
      {columns.map((column, index) => (
        <div key={index} className="flex snap-start flex-col gap-4">
          {column.map((testimonial) => (
            <TestimonialCard key={testimonial.id} testimonial={testimonial} />
          ))}
        </div>
      ))}
    </ScrollCarousel>
  );
}
