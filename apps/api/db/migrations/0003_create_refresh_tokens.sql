-- 0003_create_refresh_tokens.sql
-- One row per issued refresh token (id = JWT "jti"). Tokens are rotated on every refresh;
-- presenting a revoked token means it was stolen or replayed, so the whole family is revoked.

CREATE TABLE refresh_tokens (
  id         uuid        PRIMARY KEY,
  user_id    uuid        NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  family_id  uuid        NOT NULL,
  expires_at timestamptz NOT NULL,
  revoked_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX refresh_tokens_user_id_idx ON refresh_tokens (user_id);
CREATE INDEX refresh_tokens_family_id_idx ON refresh_tokens (family_id);
CREATE INDEX refresh_tokens_expires_at_idx ON refresh_tokens (expires_at);
