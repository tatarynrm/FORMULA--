-- 0004_user_profile_and_admin_levels.sql
-- Surname, admin levels (superadmin / subadmin) and the extended student profile.

ALTER TABLE users
  ADD COLUMN surname     text NOT NULL DEFAULT '',
  ADD COLUMN admin_level text;

-- Every admin that existed before this migration keeps full rights.
UPDATE users SET admin_level = 'superadmin' WHERE role = 'admin';

ALTER TABLE users
  ADD CONSTRAINT users_admin_level_check CHECK (admin_level IN ('superadmin', 'subadmin')),
  -- Only admins have a level, and every admin has one.
  ADD CONSTRAINT users_admin_level_role_check CHECK ((role = 'admin') = (admin_level IS NOT NULL));

-- Lookup tables for the onboarding choices. Labels are data, so they can be edited without a deploy.
CREATE TABLE profile_statuses (
  code       text PRIMARY KEY,
  label      text NOT NULL,
  sort_order integer NOT NULL DEFAULT 0
);

CREATE TABLE profile_goals (
  code       text PRIMARY KEY,
  label      text NOT NULL,
  sort_order integer NOT NULL DEFAULT 0
);

INSERT INTO profile_statuses (code, label, sort_order) VALUES
  ('schoolboy', 'Школяр', 1),
  ('schoolgirl', 'Школярка', 2),
  ('student', 'Студент', 3),
  ('intern', 'Лікар-інтерн', 4),
  ('doctor', 'Лікар', 5);

INSERT INTO profile_goals (code, label, sort_order) VALUES
  ('nmt', 'НМТ', 1),
  ('krok', 'Крок', 2),
  ('exam', 'Іспит', 3),
  ('classes', 'Пари', 4);

CREATE TABLE user_profiles (
  user_id                 uuid PRIMARY KEY REFERENCES users (id) ON DELETE CASCADE,
  status_code             text REFERENCES profile_statuses (code),
  goal_code               text REFERENCES profile_goals (code),
  avatar_url              text,
  -- 'university' or 'other' (school, college, courses...); the name is free text.
  institution_kind        text,
  institution_name        text,
  onboarding_completed_at timestamptz,
  created_at              timestamptz NOT NULL DEFAULT now(),
  updated_at              timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT user_profiles_institution_kind_check CHECK (institution_kind IN ('university', 'other'))
);

CREATE TRIGGER user_profiles_set_updated_at
  BEFORE UPDATE ON user_profiles
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
