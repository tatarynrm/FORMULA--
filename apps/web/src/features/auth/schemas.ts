import { AUTH } from '@formula/shared';
import { z } from 'zod';

import { t } from '@/locales';

// Form schemas mirror the api rules from `@formula/shared` (same limits via `AUTH`),
// but carry Ukrainian error messages from the dictionary and UI-only fields.
const { validation } = t.auth;

const emailField = z.string().trim().toLowerCase().pipe(z.email(validation.emailInvalid));

const passwordField = z
  .string()
  .min(AUTH.PASSWORD_MIN_LENGTH, validation.passwordMin)
  .max(AUTH.PASSWORD_MAX_LENGTH, validation.passwordMax);

/** Login form = api payload + UI-only "remember me" flag (not sent to the api). */
export const loginFormSchema = z.object({
  email: emailField,
  password: passwordField,
  rememberMe: z.boolean(),
});

/** Register form = api payload + the terms checkbox (UI-only, must be ticked). */
export const registerFormSchema = z.object({
  name: z.string().trim().min(2, validation.nameMin).max(100, validation.nameMax),
  surname: z.string().trim().min(2, validation.surnameMin).max(100, validation.surnameMax),
  email: emailField,
  password: passwordField,
  acceptTerms: z.boolean().refine((value) => value, { message: t.auth.acceptTermsRequired }),
});

export type LoginFormValues = z.infer<typeof loginFormSchema>;
export type RegisterFormValues = z.infer<typeof registerFormSchema>;
