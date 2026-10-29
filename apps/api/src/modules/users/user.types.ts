/**
 * Row of the `users` table, joined with the profile. A user carries no privileges: whether someone
 * is an admin is answered by the `admins` table (see the access module), never by this row.
 */
export interface UserRow {
  id: string;
  email: string;
  name: string;
  surname: string;
  /** `null` for an account created with Google that has not set a password yet. */
  password_hash: string | null;
  google_id: string | null;
  last_login_at: Date | null;
  created_at: Date;
  updated_at: Date;
  /** From `LEFT JOIN user_profiles`. */
  onboarding_completed_at: Date | null;
  avatar_file_id: string | null;
}

/** Internal user model. Contains the password hash, so it must never be sent to clients. */
export interface UserRecord {
  id: string;
  email: string;
  name: string;
  surname: string;
  passwordHash: string | null;
  googleId: string | null;
  lastLoginAt: Date | null;
  createdAt: Date;
  onboardingCompleted: boolean;
  avatarFileId: string | null;
}

export interface CreateUserInput {
  email: string;
  name: string;
  surname: string;
  /** `null` when the account is created with Google. */
  passwordHash: string | null;
  googleId?: string;
}
