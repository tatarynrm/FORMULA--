-- 0008_users_admin_sync_trigger.sql
-- Makes `role` and `admin_level` easy to edit by hand (psql, DBeaver, Adminer...).
--
-- Migration 0004 added the rule "admin <=> has an admin level". It protects the data, but it also
-- made a plain `UPDATE users SET role = 'admin'` fail, because the level was still empty.
-- This trigger fills the missing half before the rule is checked:
--
--   * role set to 'admin', no level      -> level becomes 'superadmin'
--   * role set to 'student'              -> level is cleared
--   * only admin_level changed to a value -> role becomes 'admin'
--   * only admin_level cleared            -> role becomes 'student'

CREATE OR REPLACE FUNCTION users_sync_admin_level() RETURNS trigger AS $$
BEGIN
  -- Someone edited admin_level but left role alone: the level decides the role.
  IF TG_OP = 'UPDATE'
     AND NEW.admin_level IS DISTINCT FROM OLD.admin_level
     AND NEW.role = OLD.role THEN
    NEW.role := CASE WHEN NEW.admin_level IS NULL THEN 'student' ELSE 'admin' END;
  END IF;

  -- The role decides the level. Admins added by hand get full rights; narrow them in the admin
  -- panel (Команда) or by setting admin_level to 'subadmin'.
  IF NEW.role = 'admin' AND NEW.admin_level IS NULL THEN
    NEW.admin_level := 'superadmin';
  ELSIF NEW.role <> 'admin' THEN
    NEW.admin_level := NULL;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER users_sync_admin_level
  BEFORE INSERT OR UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION users_sync_admin_level();
