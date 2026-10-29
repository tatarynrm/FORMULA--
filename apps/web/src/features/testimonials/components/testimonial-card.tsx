import type { PublicTestimonial } from '@formula/shared';

import { RatingStars } from './rating-stars';
import { TestimonialAvatar } from './testimonial-avatar';

/** One published testimonial on the landing page: round photo (or letter), name, stars, text. */
export function TestimonialCard({ testimonial }: { testimonial: PublicTestimonial }) {
  return (
    <article className="bg-card lift flex flex-col gap-4 rounded-2xl p-6">
      <div className="flex items-center gap-3">
        <TestimonialAvatar
          name={testimonial.authorName}
          testimonialId={testimonial.hasAvatar ? testimonial.id : null}
        />
        <div className="flex min-w-0 flex-col gap-1">
          <p className="text-body-md text-foreground truncate font-bold">
            {testimonial.authorName}
          </p>
          <RatingStars value={testimonial.rating} />
        </div>
      </div>
      <p className="text-body-md text-text-secondary break-words whitespace-pre-line">
        {testimonial.text}
      </p>
    </article>
  );
}
