import type { TestimonialStatus } from '@formula/shared';

export const testimonialKeys = {
  /** Published testimonials of the landing page. */
  public: ['testimonials', 'public'] as const,
  /** The testimonials of the signed-in author. */
  mine: ['testimonials', 'mine'] as const,
  /** Everything of the moderation page. */
  admin: ['admin', 'testimonials'] as const,
  adminList: (status: TestimonialStatus) => ['admin', 'testimonials', 'list', status] as const,
  counts: ['admin', 'testimonials', 'counts'] as const,
};
