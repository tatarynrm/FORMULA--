-- 0014_google_sign_in.sql
-- Sign in with Google. An account created by Google has no password until the user sets one,
-- so the hash becomes optional; the Google account id links the two sides.

ALTER TABLE users ALTER COLUMN password_hash DROP NOT NULL;

ALTER TABLE users ADD COLUMN google_id text;
CREATE UNIQUE INDEX users_google_id_key ON users (google_id) WHERE google_id IS NOT NULL;
