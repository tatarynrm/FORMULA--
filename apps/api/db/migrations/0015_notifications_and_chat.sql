-- 0015_notifications_and_chat.sql
-- In-site notifications (the bell) and the support chat (one student <-> support conversation).

-- One row per recipient. A news item for 1000 students is 1000 rows: cheap, and each one has its
-- own read mark. Future channels (Telegram, email) send the same row through their own transport.
CREATE TABLE notifications (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  -- See NOTIFICATION_TYPES in @formula/shared.
  type       text NOT NULL,
  title      text NOT NULL,
  body       text NOT NULL DEFAULT '',
  -- Path inside the site (never a full URL).
  link       text,
  -- Ids and other details of the thing the notification is about.
  data       jsonb NOT NULL DEFAULT '{}'::jsonb,
  read_at    timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT notifications_type_check CHECK (
    type IN ('review_pending', 'review_done', 'access_granted', 'news', 'chat_message', 'system')
  )
);

CREATE INDEX notifications_user_created_idx ON notifications (user_id, created_at DESC);
CREATE INDEX notifications_user_unread_idx ON notifications (user_id) WHERE read_at IS NULL;

-- News an admin sent to every student, kept for the history page.
CREATE TABLE notification_broadcasts (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title            text NOT NULL,
  body             text NOT NULL DEFAULT '',
  link             text,
  sent_by          uuid REFERENCES users (id) ON DELETE SET NULL,
  recipients_count integer NOT NULL DEFAULT 0,
  created_at       timestamptz NOT NULL DEFAULT now()
);

-- One conversation per student with "the support team" (every admin who has the support section).
CREATE TABLE chat_conversations (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id      uuid NOT NULL UNIQUE REFERENCES users (id) ON DELETE CASCADE,
  status          text NOT NULL DEFAULT 'open',
  last_message_at timestamptz,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT chat_conversations_status_check CHECK (status IN ('open', 'closed'))
);

CREATE TRIGGER chat_conversations_set_updated_at
  BEFORE UPDATE ON chat_conversations
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE INDEX chat_conversations_activity_idx ON chat_conversations (last_message_at DESC NULLS LAST);

CREATE TABLE chat_messages (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL REFERENCES chat_conversations (id) ON DELETE CASCADE,
  sender_id       uuid REFERENCES users (id) ON DELETE SET NULL,
  -- 'student' or 'support' (an admin answering for the team).
  sender_role     text NOT NULL,
  body            text NOT NULL DEFAULT '',
  image_file_id   uuid REFERENCES files (id) ON DELETE SET NULL,
  created_at      timestamptz NOT NULL DEFAULT now(),
  -- When the other side read it.
  read_at         timestamptz,

  CONSTRAINT chat_messages_sender_role_check CHECK (sender_role IN ('student', 'support')),
  CONSTRAINT chat_messages_content_check CHECK (body <> '' OR image_file_id IS NOT NULL)
);

CREATE INDEX chat_messages_conversation_idx ON chat_messages (conversation_id, created_at DESC);
CREATE INDEX chat_messages_unread_idx ON chat_messages (conversation_id, sender_role) WHERE read_at IS NULL;

-- Pictures sent in the chat get their own purpose: any signed-in user may upload one, and only
-- the two sides of the conversation may open it.
ALTER TABLE files DROP CONSTRAINT files_purpose_check;
ALTER TABLE files ADD CONSTRAINT files_purpose_check
  CHECK (purpose IN ('avatar', 'image', 'video', 'document', 'chat'));

-- Menu: the student's support chat, and the admin sections "support" (answering students) and
-- "news" (sending a news item to every student). Both are grantable to subadmins like the others.
INSERT INTO menu_items (audience, key, label, href, icon, exact_match, sort_order, is_system, superadmin_only) VALUES
  ('student', 'support', 'Підтримка', '/cabinet/support', 'chat', false, 60, true, false),
  ('admin',   'support', 'Підтримка', '/admin/support',   'chat', false, 52, true, false),
  ('admin',   'news',    'Новини',    '/admin/news',      'bell', false, 54, true, false);
