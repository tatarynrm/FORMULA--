'use client';

import { TESTIMONIALS } from '@formula/shared';
import { Star } from 'lucide-react';
import { type KeyboardEvent, useState } from 'react';

import { cn } from '@/lib/utils';
import { format } from '@/lib/format';
import { t } from '@/locales';

interface RatingInputProps {
  /** 0 while nothing is chosen. */
  value: number;
  onChange: (value: number) => void;
  /** Id of the element that names the group (the visible label). */
  labelledBy?: string;
  invalid?: boolean;
}

const STARS = Array.from({ length: TESTIMONIALS.RATING_MAX }, (_, index) => index + 1);

/**
 * Pick 1 to 5 stars: a radio group, so arrows move the choice and a screen reader says
 * "3 з 5". The stars under the pointer light up before the click.
 */
export function RatingInput({ value, onChange, labelledBy, invalid }: RatingInputProps) {
  const [hover, setHover] = useState(0);
  const shown = hover || value;

  function onKeyDown(event: KeyboardEvent<HTMLButtonElement>) {
    const step =
      event.key === 'ArrowRight' || event.key === 'ArrowUp'
        ? 1
        : event.key === 'ArrowLeft' || event.key === 'ArrowDown'
          ? -1
          : 0;
    if (step === 0) return;
    event.preventDefault();
    const next = Math.min(
      TESTIMONIALS.RATING_MAX,
      Math.max(TESTIMONIALS.RATING_MIN, (value || 0) + step),
    );
    onChange(next);
    // Focus follows the choice (the stars are re-rendered with the new tab stop).
    const group = event.currentTarget.parentElement;
    requestAnimationFrame(() => group?.querySelectorAll('button')[next - 1]?.focus());
  }

  return (
    <div
      role="radiogroup"
      aria-labelledby={labelledBy}
      aria-invalid={invalid || undefined}
      onMouseLeave={() => setHover(0)}
      className="flex items-center gap-1"
    >
      {STARS.map((star) => (
        <button
          key={star}
          type="button"
          role="radio"
          aria-checked={value === star}
          aria-label={format(t.testimonials.rating.option, { count: star })}
          // One tab stop: the chosen star, or the first one while nothing is chosen.
          tabIndex={value === star || (value === 0 && star === 1) ? 0 : -1}
          onClick={() => onChange(star)}
          onMouseEnter={() => setHover(star)}
          onKeyDown={onKeyDown}
          className="focus-visible:ring-ring rounded-full p-1 transition-transform outline-none hover:scale-110 focus-visible:ring-[3px]"
        >
          <Star
            aria-hidden
            className={cn(
              'size-8 transition-colors',
              star <= shown ? 'fill-primary text-primary' : 'text-border fill-transparent',
            )}
          />
        </button>
      ))}
    </div>
  );
}
