-- 0013_presence.sql
-- Who is online and when they were on the site.
--
-- The live part ("online right now") lives in Redis with a short expiry: every authenticated
-- request refreshes it. This table is the durable part, written at most once a minute per user:
-- one row per stretch of activity, so the admin can see when a student was on the site.

ALTER TABLE users ADD COLUMN last_seen_at timestamptz;

CREATE TABLE user_sessions (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      uuid NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  started_at   timestamptz NOT NULL DEFAULT now(),
  last_seen_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX user_sessions_user_id_idx ON user_sessions (user_id, last_seen_at DESC);
