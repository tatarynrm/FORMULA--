import { NOTIFICATIONS } from '@formula/shared';
import { z } from 'zod';

import { format } from '@/lib/format';
import { t } from '@/locales';

// The api limits, with Ukrainian messages from the dictionary.
const copy = t.notifications.news.composer;

/** A path inside the site: starts with one "/" (not "//", which browsers read as another host). */
const isSitePath = (value: string) => value.startsWith('/') && !value.startsWith('//');

/** "Нова новина" on /admin/news. The link is typed as text: an empty field means "no link". */
export const newsFormSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, copy.titleRequired)
    .max(
      NOTIFICATIONS.TITLE_MAX_LENGTH,
      format(copy.titleMax, { max: NOTIFICATIONS.TITLE_MAX_LENGTH }),
    ),
  body: z
    .string()
    .trim()
    .min(1, copy.bodyRequired)
    .max(
      NOTIFICATIONS.BODY_MAX_LENGTH,
      format(copy.bodyMax, { max: NOTIFICATIONS.BODY_MAX_LENGTH }),
    ),
  link: z
    .string()
    .trim()
    .max(
      NOTIFICATIONS.LINK_MAX_LENGTH,
      format(copy.linkMax, { max: NOTIFICATIONS.LINK_MAX_LENGTH }),
    )
    .refine((value) => value === '' || isSitePath(value), copy.linkInvalid),
});

export type NewsFormValues = z.infer<typeof newsFormSchema>;
