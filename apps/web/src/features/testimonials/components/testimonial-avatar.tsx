import { cn } from '@/lib/utils';
import { testimonialAvatarUrl } from '@/lib/files';

interface TestimonialAvatarProps {
  /** Used for the letter when there is no picture. */
  name: string;
  /** Id of the published testimonial whose author has a picture; `null` shows the letter. */
  testimonialId?: string | null;
  className?: string;
}

/**
 * The round picture of an author on the landing page: the profile photo when the author is a
 * registered user with one, otherwise the first letter on the brand color. A plain `<img>` on
 * purpose: it is served by our api and has to work for visitors who are not signed in.
 */
export function TestimonialAvatar({ name, testimonialId, className }: TestimonialAvatarProps) {
  return (
    <span
      aria-hidden
      className={cn(
        'bg-primary text-primary-foreground text-body-md flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-full font-bold',
        className,
      )}
    >
      {testimonialId ? (
        // eslint-disable-next-line @next/next/no-img-element -- served by our api, not by the Next.js image optimizer
        <img
          src={testimonialAvatarUrl(testimonialId)}
          alt=""
          loading="lazy"
          decoding="async"
          className="size-full object-cover"
        />
      ) : (
        name.charAt(0).toUpperCase()
      )}
    </span>
  );
}
