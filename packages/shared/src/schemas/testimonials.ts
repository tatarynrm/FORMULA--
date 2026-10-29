import { z } from 'zod';

import { AUTH, TESTIMONIAL_STATUSES, TESTIMONIALS } from '../constants/index.js';
import { UA_PHONE_PATTERN } from '../utils/phone.js';

const name = z.string().trim().min(AUTH.NAME_MIN_LENGTH).max(AUTH.NAME_MAX_LENGTH);
const surname = z.string().trim().min(AUTH.SURNAME_MIN_LENGTH).max(AUTH.SURNAME_MAX_LENGTH);
const email = z.string().trim().toLowerCase().max(254).pipe(z.email());
/** Written as `+380 98 938 55 85`. */
const phone = z.string().trim().regex(UA_PHONE_PATTERN);
const text = z.string().trim().min(TESTIMONIALS.TEXT_MIN_LENGTH).max(TESTIMONIALS.TEXT_MAX_LENGTH);
const rating = z.number().int().min(TESTIMONIALS.RATING_MIN).max(TESTIMONIALS.RATING_MAX);

/**
 * A new testimonial. A signed-in author sends no name and no email: the api takes them from the
 * account. A guest must send name, surname and email. The phone is always optional. `website` is a hidden field real people never fill; a bot that does is dropped.
 */
export const submitTestimonialSchema = z.object({
  name: name.optional(),
  surname: surname.optional(),
  email: email.optional(),
  phone: phone.optional(),
  text,
  rating,
  website: z.string().max(200).optional(),
});
export type SubmitTestimonialInput = z.infer<typeof submitTestimonialSchema>;

/** An admin may fix the wording and change the state; every field is optional. */
export const updateTestimonialSchema = z.object({
  name: name.optional(),
  surname: surname.optional(),
  email: email.optional(),
  /** `null` removes the phone. */
  phone: phone.nullable().optional(),
  text: text.optional(),
  rating: rating.optional(),
  status: z.enum(TESTIMONIAL_STATUSES).optional(),
});
export type UpdateTestimonialInput = z.infer<typeof updateTestimonialSchema>;
