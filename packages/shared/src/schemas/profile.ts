import { z } from 'zod';

import {
  AUTH,
  INSTITUTION_KINDS,
  MESSENGERS,
  PROFILE,
  TELEGRAM_USERNAME_PATTERN,
} from '../constants/index.js';
import { UA_PHONE_PATTERN } from '../utils/phone.js';

/** One messenger the person uses; `username` is only meaningful for Telegram (the nickname). */
export const profileMessengerSchema = z.object({
  kind: z.enum(MESSENGERS),
  username: z.string().nullable(),
});

export const profileOptionSchema = z.object({ code: z.string(), label: z.string() });

export const profileOptionsSchema = z.object({
  statuses: z.array(profileOptionSchema),
  goals: z.array(profileOptionSchema),
});

/** The profile page: account data (students and admins) plus the student fields. */
export const profileSchema = z.object({
  name: z.string(),
  surname: z.string(),
  email: z.string(),
  /** Uploaded avatar, opened at `/api/files/:id`. */
  avatarFileId: z.uuid().nullable(),
  /** `+380 98 938 55 85`, optional. */
  phone: z.string().nullable(),
  /** The messengers the person says they use. */
  messengers: z.array(profileMessengerSchema),
  statusCode: z.string().nullable(),
  goalCode: z.string().nullable(),
  institutionKind: z.enum(INSTITUTION_KINDS).nullable(),
  institutionName: z.string().nullable(),
  onboardingCompleted: z.boolean(),
});

/** Every field is optional: onboarding can be saved partially or skipped. */
export const updateProfileSchema = z.object({
  name: z.string().trim().min(AUTH.NAME_MIN_LENGTH).max(AUTH.NAME_MAX_LENGTH).optional(),
  surname: z.string().trim().min(AUTH.SURNAME_MIN_LENGTH).max(AUTH.SURNAME_MAX_LENGTH).optional(),
  /** Id of a file uploaded with `purpose=avatar` by the same user. `null` removes the avatar. */
  avatarFileId: z.uuid().nullable().optional(),
  statusCode: z.string().min(1).max(32).nullable().optional(),
  goalCode: z.string().min(1).max(32).nullable().optional(),
  institutionKind: z.enum(INSTITUTION_KINDS).nullable().optional(),
  institutionName: z.string().trim().max(PROFILE.INSTITUTION_MAX_LENGTH).nullable().optional(),
  /** Marks the onboarding step as finished (or skipped). */
  completeOnboarding: z.boolean().optional(),
  /** Written as `+380 98 938 55 85`; `null` removes it. */
  phone: z.string().regex(UA_PHONE_PATTERN).nullable().optional(),
  /** The whole list at once: what is missing from it is removed. */
  messengers: z
    .array(
      z.object({
        kind: z.enum(MESSENGERS),
        username: z.string().regex(TELEGRAM_USERNAME_PATTERN).nullable().optional(),
      }),
    )
    .max(MESSENGERS.length)
    .optional(),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1).max(AUTH.PASSWORD_MAX_LENGTH),
  newPassword: z.string().min(AUTH.PASSWORD_MIN_LENGTH).max(AUTH.PASSWORD_MAX_LENGTH),
});

export type ProfileMessenger = z.infer<typeof profileMessengerSchema>;
export type ProfileOption = z.infer<typeof profileOptionSchema>;
export type ProfileOptions = z.infer<typeof profileOptionsSchema>;
export type Profile = z.infer<typeof profileSchema>;
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
