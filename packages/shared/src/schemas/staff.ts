import { z } from 'zod';

import { ADMIN_LEVELS, AUTH } from '../constants/index.js';

export const staffMemberSchema = z.object({
  id: z.uuid(),
  email: z.string(),
  name: z.string(),
  surname: z.string(),
  adminLevel: z.enum(ADMIN_LEVELS),
  /** Section keys a subadmin may use. Always empty for superadmins, who can use everything. */
  permissions: z.array(z.string()),
  createdAt: z.string(),
});

export const permissionsSchema = z.array(z.string().min(1).max(64)).max(100);

/**
 * Adds a subadmin. An existing account is promoted; for an unknown email the account is created,
 * which needs a name, surname and password.
 */
export const createStaffSchema = z.object({
  email: z.string().trim().toLowerCase().pipe(z.email()),
  name: z.string().trim().min(AUTH.NAME_MIN_LENGTH).max(AUTH.NAME_MAX_LENGTH).optional(),
  surname: z.string().trim().min(AUTH.SURNAME_MIN_LENGTH).max(AUTH.SURNAME_MAX_LENGTH).optional(),
  password: z.string().min(AUTH.PASSWORD_MIN_LENGTH).max(AUTH.PASSWORD_MAX_LENGTH).optional(),
  permissions: permissionsSchema,
});

export const updateStaffPermissionsSchema = z.object({ permissions: permissionsSchema });

export type StaffMember = z.infer<typeof staffMemberSchema>;
export type CreateStaffInput = z.infer<typeof createStaffSchema>;
