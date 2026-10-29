-- 0009_separate_admins_from_users.sql
-- Users are users; admins are something else.
--
-- Until now `users` carried `role` and `admin_level`, so every piece of code that touches a user
-- row (sign-up, profile, listings) was one mistake away from touching privileges. From now on:
--   * `users`             identity and credentials only, nothing that grants power;
--   * `admins`            one row = this user is an admin (the level lives here);
--   * `admin_permissions` sections a subadmin may use, tied to `admins`, never to `users`.
-- Being an admin means having a row in `admins`. Removing the row removes the admin, together with
-- every permission (ON DELETE CASCADE), so no stale rights can survive a demotion.

CREATE TABLE admins (
  user_id    uuid PRIMARY KEY REFERENCES users (id) ON DELETE CASCADE,
  -- No default on purpose: privileges are always granted explicitly.
  level      text NOT NULL,
  created_by uuid REFERENCES users (id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT admins_level_check CHECK (level IN ('superadmin', 'subadmin'))
);

COMMENT ON TABLE admins IS
  'Admin accounts. A user is an admin exactly when a row exists here. level = superadmin (everything) or subadmin (only the sections in admin_permissions).';

CREATE TRIGGER admins_set_updated_at
  BEFORE UPDATE ON admins
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Carry the existing admins over.
INSERT INTO admins (user_id, level)
SELECT id, admin_level FROM users WHERE role = 'admin';

-- Permissions now belong to an admin. Rows of anyone who is not an admin are meaningless.
DELETE FROM admin_permissions WHERE user_id NOT IN (SELECT user_id FROM admins);

ALTER TABLE admin_permissions DROP CONSTRAINT admin_permissions_user_id_fkey;
ALTER TABLE admin_permissions RENAME COLUMN user_id TO admin_id;
ALTER TABLE admin_permissions
  ADD CONSTRAINT admin_permissions_admin_id_fkey
  FOREIGN KEY (admin_id) REFERENCES admins (user_id) ON DELETE CASCADE;

-- The hand-editing trigger from 0008 is no longer needed: there is nothing to keep in sync.
DROP TRIGGER users_sync_admin_level ON users;
DROP FUNCTION users_sync_admin_level();

ALTER TABLE users
  DROP CONSTRAINT users_admin_level_role_check,
  DROP CONSTRAINT users_admin_level_check,
  DROP CONSTRAINT users_role_check;
ALTER TABLE users
  DROP COLUMN admin_level,
  DROP COLUMN role;

-- Avatars are uploaded files now (a plain URL column cannot be access-controlled or cleaned up).
ALTER TABLE user_profiles
  ADD COLUMN avatar_file_id uuid REFERENCES files (id) ON DELETE SET NULL;
ALTER TABLE user_profiles
  DROP COLUMN avatar_url;
