-- 0016_testimonials.sql
-- Testimonials ("відгуки") that visitors and students leave for the landing page. Each one waits
-- for an admin: publish (approved), decline (rejected), or fix the wording first.

CREATE TABLE testimonials (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  -- The signed-in author. A guest has none. The row goes away with the account.
  user_id        uuid REFERENCES users (id) ON DELETE CASCADE,
  -- Name as shown on the site: copied from the account at the time of writing, or typed by a guest.
  -- An admin may correct it.
  author_name    text NOT NULL,
  author_surname text NOT NULL,
  body           text NOT NULL,
  rating         smallint NOT NULL,
  status         text NOT NULL DEFAULT 'pending',
  -- Salted hash of a guest's address, only to limit how many a guest can send per hour.
  ip_hash        text,
  -- Set when an admin changed the text, the name or the rating.
  edited_at      timestamptz,
  moderated_by   uuid REFERENCES users (id) ON DELETE SET NULL,
  moderated_at   timestamptz,
  created_at     timestamptz NOT NULL DEFAULT now(),
  updated_at     timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT testimonials_status_check CHECK (status IN ('pending', 'approved', 'rejected')),
  CONSTRAINT testimonials_rating_check CHECK (rating BETWEEN 1 AND 5)
);

CREATE TRIGGER testimonials_set_updated_at
  BEFORE UPDATE ON testimonials
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE INDEX testimonials_status_created_idx ON testimonials (status, created_at DESC);
CREATE INDEX testimonials_user_idx ON testimonials (user_id) WHERE user_id IS NOT NULL;
CREATE INDEX testimonials_guest_rate_idx ON testimonials (ip_hash, created_at) WHERE ip_hash IS NOT NULL;

-- New kinds of notifications: "a testimonial waits" (admins) and "your testimonial was decided" (author).
ALTER TABLE notifications DROP CONSTRAINT notifications_type_check;
ALTER TABLE notifications ADD CONSTRAINT notifications_type_check CHECK (
  type IN (
    'review_pending', 'review_done', 'access_granted', 'news', 'chat_message',
    'testimonial_pending', 'testimonial_result', 'system'
  )
);

-- Menu: the moderation section for admins (grantable to subadmins) and the student's own page.
INSERT INTO menu_items (audience, key, label, href, icon, exact_match, sort_order, is_system, superadmin_only) VALUES
  ('admin',   'testimonials', 'Відгуки',   '/admin/testimonials', 'star', false, 56, true, false),
  ('student', 'feedback',     'Мій відгук', '/cabinet/feedback',   'star', false, 70, true, false);
