import { TESTIMONIALS } from '@formula/shared';
import { Star } from 'lucide-react';

import { cn } from '@/lib/utils';
import { format } from '@/lib/format';
import { t } from '@/locales';

interface RatingStarsProps {
  /** 1 to 5. */
  value: number;
  className?: string;
}

const STARS = Array.from({ length: TESTIMONIALS.RATING_MAX }, (_, index) => index + 1);

/** Five stars, the first `value` filled. Reads as "Оцінка: 4 з 5" for a screen reader. */
export function RatingStars({ value, className }: RatingStarsProps) {
  return (
    <span
      role="img"
      aria-label={format(t.testimonials.rating.label, { count: value })}
      className={cn('flex items-center gap-0.5', className)}
    >
      {STARS.map((star) => (
        <Star
          key={star}
          aria-hidden
          className={cn(
            'size-4',
            star <= value ? 'fill-primary text-primary' : 'text-border fill-transparent',
          )}
        />
      ))}
    </span>
  );
}
