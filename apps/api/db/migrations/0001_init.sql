-- 0001_init.sql
-- Foundation only: extensions and helpers. Business tables are added in later migrations.

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Reusable trigger function: keeps updated_at in sync.
-- Usage in a later migration:
--   CREATE TRIGGER set_updated_at BEFORE UPDATE ON some_table
--   FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
