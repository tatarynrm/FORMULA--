import { AUTH, TEST_KINDS, TESTS } from '@formula/shared';
import { z } from 'zod';

import { format } from '@/lib/format';
import { t } from '@/locales';

import { TEST_TEXT_LIMITS, parseYear } from './utils/test-settings';

// Form schemas use the limits of the api DTOs but carry Ukrainian messages from the dictionary.
const copy = t.adminContent.forms;

const titleField = z
  .string()
  .trim()
  .min(1, copy.titleRequired)
  .max(TESTS.TITLE_MAX_LENGTH, format(copy.titleMax, { max: TESTS.TITLE_MAX_LENGTH }));

/** One name: topic, subtopic, material. */
export const nameFormSchema = z.object({ title: titleField });

export const SUBJECT_DESCRIPTION_MAX = 2000;

/** Create or edit a subject. */
export const subjectFormSchema = z.object({
  title: titleField,
  description: z
    .string()
    .trim()
    .max(SUBJECT_DESCRIPTION_MAX, format(copy.descriptionMax, { max: SUBJECT_DESCRIPTION_MAX })),
});

/** "Додати" on the bases, booklets and AMPS lists and "Створити тест" in a subtopic. */
export const createTestFormSchema = z.object({
  kind: z.enum(TEST_KINDS),
  title: titleField,
  category: z
    .string()
    .trim()
    .max(TEST_TEXT_LIMITS.category, format(copy.textMax, { max: TEST_TEXT_LIMITS.category })),
  // Typed as text: an empty field means "no year".
  year: z
    .string()
    .trim()
    .refine((value) => parseYear(value) !== null, copy.yearInvalid),
  specialty: z
    .string()
    .trim()
    .max(TEST_TEXT_LIMITS.specialty, format(copy.textMax, { max: TEST_TEXT_LIMITS.specialty })),
});

const personName = (min: number, max: number) =>
  z
    .string()
    .trim()
    .min(min, format(copy.nameLength, { min, max }))
    .max(max, format(copy.nameLength, { min, max }));

/** "Редагувати ім'я" of a student (the api has the same limits). */
export const studentNameFormSchema = z.object({
  name: personName(AUTH.NAME_MIN_LENGTH, AUTH.NAME_MAX_LENGTH),
  surname: personName(AUTH.SURNAME_MIN_LENGTH, AUTH.SURNAME_MAX_LENGTH),
});

export type NameFormValues = z.infer<typeof nameFormSchema>;
export type StudentNameFormValues = z.infer<typeof studentNameFormSchema>;
export type SubjectFormValues = z.infer<typeof subjectFormSchema>;
export type CreateTestFormValues = z.infer<typeof createTestFormSchema>;
