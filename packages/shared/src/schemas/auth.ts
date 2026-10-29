import { z } from 'zod';

import { ADMIN_LEVELS, AUTH, USER_ROLES } from '../constants/index.js';

const emailSchema = z.string().trim().toLowerCase().pipe(z.email());

const passwordSchema = z.string().min(AUTH.PASSWORD_MIN_LENGTH).max(AUTH.PASSWORD_MAX_LENGTH);

export const loginSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
});

export const registerSchema = z.object({
  name: z.string().trim().min(AUTH.NAME_MIN_LENGTH).max(AUTH.NAME_MAX_LENGTH),
  surname: z.string().trim().min(AUTH.SURNAME_MIN_LENGTH).max(AUTH.SURNAME_MAX_LENGTH),
  email: emailSchema,
  password: passwordSchema,
});

/** User as exposed to clients. Never contains the password hash. */
export const authUserSchema = z.object({
  id: z.uuid(),
  email: z.string(),
  name: z.string(),
  surname: z.string(),
  role: z.enum(USER_ROLES),
  /** Set only for admins. */
  adminLevel: z.enum(ADMIN_LEVELS).nullable(),
  /** False until the student finishes (or skips) the "tell us about yourself" step. */
  onboardingCompleted: z.boolean(),
  /** Uploaded avatar, opened at `/api/files/:id`. */
  avatarFileId: z.uuid().nullable(),
  /** False for an account created with Google that has not set a password yet. */
  hasPassword: z.boolean(),
  createdAt: z.string(),
});

/** Body of login, register, refresh and me responses. Tokens travel in httpOnly cookies only. */
export const authSessionSchema = z.object({
  user: authUserSchema,
});

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type AuthUser = z.infer<typeof authUserSchema>;
export type AuthSession = z.infer<typeof authSessionSchema>;

export interface JwtPayload {
  sub: string;
  type: 'access' | 'refresh';
  /** Refresh token id (matches `refresh_tokens.id`); absent on access tokens. */
  jti?: string;
}
