import { AUTH, TESTIMONIALS, UA_PHONE_PATTERN } from '@formula/shared';
import { z } from 'zod';

import { format } from '@/lib/format';
import { t } from '@/locales';

const errors = t.testimonials.form.errors;

const text = z
  .string()
  .trim()
  .min(TESTIMONIALS.TEXT_MIN_LENGTH, format(errors.textMin, { min: TESTIMONIALS.TEXT_MIN_LENGTH }))
  .max(TESTIMONIALS.TEXT_MAX_LENGTH, format(errors.textMax, { max: TESTIMONIALS.TEXT_MAX_LENGTH }));

/** Empty is fine (the phone is optional); otherwise it must be written as +380 98 938 55 85. */
const optionalPhone = z
  .string()
  .refine((value) => value === '' || UA_PHONE_PATTERN.test(value), errors.phoneFormat);

const emailField = z
  .string()
  .trim()
  .min(1, errors.emailRequired)
  .pipe(z.email(errors.emailInvalid));

const rating = z
  .number()
  .int()
  .min(TESTIMONIALS.RATING_MIN, errors.ratingRequired)
  .max(TESTIMONIALS.RATING_MAX, errors.ratingRequired);

/**
 * The form of a testimonial. A signed-in author does not type a name (the api takes it from the
 * account), a guest must: `requireName` switches that. `website` is the hidden bot trap.
 */
export const createTestimonialFormSchema = (requireName: boolean) =>
  z.object({
    name: requireName
      ? z
          .string()
          .trim()
          .min(AUTH.NAME_MIN_LENGTH, errors.nameRequired)
          .max(AUTH.NAME_MAX_LENGTH, format(errors.nameMax, { max: AUTH.NAME_MAX_LENGTH }))
      : z.string(),
    surname: requireName
      ? z
          .string()
          .trim()
          .min(AUTH.SURNAME_MIN_LENGTH, errors.surnameRequired)
          .max(AUTH.SURNAME_MAX_LENGTH, format(errors.nameMax, { max: AUTH.SURNAME_MAX_LENGTH }))
      : z.string(),
    email: requireName ? emailField : z.string(),
    phone: optionalPhone,
    rating,
    text,
    website: z.string(),
  });

export type TestimonialFormValues = z.infer<ReturnType<typeof createTestimonialFormSchema>>;

/** What the admin may change before publishing. */
export const editTestimonialFormSchema = z.object({
  name: z
    .string()
    .trim()
    .min(AUTH.NAME_MIN_LENGTH, errors.nameRequired)
    .max(AUTH.NAME_MAX_LENGTH, format(errors.nameMax, { max: AUTH.NAME_MAX_LENGTH })),
  surname: z
    .string()
    .trim()
    .min(AUTH.SURNAME_MIN_LENGTH, errors.surnameRequired)
    .max(AUTH.SURNAME_MAX_LENGTH, format(errors.nameMax, { max: AUTH.SURNAME_MAX_LENGTH })),
  /** Empty keeps the email as it is (an old testimonial may have none). */
  email: z
    .string()
    .trim()
    .refine((value) => value === '' || z.email().safeParse(value).success, errors.emailInvalid),
  phone: optionalPhone,
  rating,
  text,
});

export type EditTestimonialFormValues = z.infer<typeof editTestimonialFormSchema>;
