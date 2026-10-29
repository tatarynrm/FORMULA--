import { AUTH } from '@formula/shared';
import { z } from 'zod';

import { t } from '@/locales';

// Mirrors the api limits from `@formula/shared`, with Ukrainian messages from the dictionary.
const { validation } = t.auth;
const security = t.profile.security;

export const accountFormSchema = z.object({
  name: z
    .string()
    .trim()
    .min(AUTH.NAME_MIN_LENGTH, validation.nameMin)
    .max(AUTH.NAME_MAX_LENGTH, validation.nameMax),
  surname: z
    .string()
    .trim()
    .min(AUTH.SURNAME_MIN_LENGTH, validation.surnameMin)
    .max(AUTH.SURNAME_MAX_LENGTH, validation.surnameMax),
});

/**
 * `requireCurrent` is false for an account created with Google that has no password yet: it sets
 * its first password without a current one (the api allows exactly that).
 */
export const createPasswordFormSchema = (requireCurrent: boolean) =>
  z
    .object({
      currentPassword: requireCurrent ? z.string().min(1, security.currentRequired) : z.string(),
      newPassword: z
        .string()
        .min(AUTH.PASSWORD_MIN_LENGTH, validation.passwordMin)
        .max(AUTH.PASSWORD_MAX_LENGTH, validation.passwordMax),
      confirmPassword: z.string(),
    })
    .refine((values) => values.newPassword === values.confirmPassword, {
      path: ['confirmPassword'],
      message: security.mismatch,
    })
    .refine((values) => values.newPassword !== values.currentPassword, {
      path: ['newPassword'],
      message: security.sameAsCurrent,
    });

export type AccountFormValues = z.infer<typeof accountFormSchema>;
export type PasswordFormValues = z.infer<ReturnType<typeof createPasswordFormSchema>>;
