-- 0002_create_users.sql
-- Accounts that sign in with email + password. Google/email-verification columns come later.

CREATE EXTENSION IF NOT EXISTS citext;

CREATE TABLE users (
  id            uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  email         citext      NOT NULL,
  name          text        NOT NULL,
  password_hash text        NOT NULL,
  role          text        NOT NULL DEFAULT 'student',
  last_login_at timestamptz,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT users_email_key UNIQUE (email),
  CONSTRAINT users_role_check CHECK (role IN ('student', 'admin'))
);

CREATE TRIGGER users_set_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
