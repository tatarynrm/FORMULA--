-- 0018_profile_contacts_and_messengers.sql
-- Contacts in the profile (a phone and the messengers a person uses) and the connection of
-- messenger bots (Telegram first) that deliver notifications.

-- A Ukrainian phone, written +380 98 938 55 85. Optional.
ALTER TABLE user_profiles ADD COLUMN phone text;
ALTER TABLE user_profiles ADD CONSTRAINT user_profiles_phone_check
  CHECK (phone IS NULL OR phone ~ '^\+380 [1-9][0-9] [0-9]{3} [0-9]{2} [0-9]{2}$');

-- Which messengers a person says they use ("how to reach me"). A new messenger is a new `kind` in
-- MESSENGERS (@formula/shared); the nickname only makes sense for Telegram.
CREATE TABLE user_messengers (
  user_id  uuid NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  kind     text NOT NULL,
  username text,
  PRIMARY KEY (user_id, kind)
);

-- A person connected through a messenger bot. One table for every provider, so a new bot
-- (Viber, ...) needs no new tables: `provider` + the id of the person in that messenger.
CREATE TABLE messenger_accounts (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id               uuid NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  provider              text NOT NULL,
  -- The person in the messenger (Telegram user id) and the chat the bot writes to.
  external_id           text NOT NULL,
  chat_id               text NOT NULL,
  username              text,
  -- The number the person shared in the bot. Until it is there the link is incomplete and
  -- nothing is sent.
  phone                 text,
  phone_verified_at     timestamptz,
  notifications_enabled boolean NOT NULL DEFAULT true,
  linked_at             timestamptz NOT NULL DEFAULT now(),
  updated_at            timestamptz NOT NULL DEFAULT now(),

  -- One person in a messenger belongs to one account, and an account has one person per messenger.
  CONSTRAINT messenger_accounts_external_key UNIQUE (provider, external_id),
  CONSTRAINT messenger_accounts_user_provider_key UNIQUE (user_id, provider)
);

CREATE TRIGGER messenger_accounts_set_updated_at
  BEFORE UPDATE ON messenger_accounts
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- One-time links ("t.me/Formula_bot?start=<token>"). Only a hash is stored.
CREATE TABLE messenger_link_tokens (
  token_hash text PRIMARY KEY,
  user_id    uuid NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  provider   text NOT NULL,
  expires_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX messenger_link_tokens_user_idx ON messenger_link_tokens (user_id, provider);
