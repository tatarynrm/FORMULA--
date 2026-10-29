-- 0005_menu_and_permissions.sql
-- Navigation comes from the server, and subadmins get access section by section.

CREATE TABLE menu_items (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  -- Who sees the item: 'student' (cabinet) or 'admin' (admin panel).
  audience         text NOT NULL,
  -- Stable section key. For admin items it doubles as the permission key.
  key              text NOT NULL,
  label            text NOT NULL,
  href             text NOT NULL,
  -- Name from the web icon registry (see MENU_ICONS in @formula/shared).
  icon             text NOT NULL,
  -- Highlight the item only on the exact path (section roots such as /cabinet).
  exact_match      boolean NOT NULL DEFAULT false,
  sort_order       integer NOT NULL DEFAULT 0,
  is_active        boolean NOT NULL DEFAULT true,
  -- Built-in items cannot be deleted (they can be renamed, reordered or hidden).
  is_system        boolean NOT NULL DEFAULT false,
  -- Never granted to subadmins (team and menu management).
  superadmin_only  boolean NOT NULL DEFAULT false,
  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT menu_items_audience_check CHECK (audience IN ('student', 'admin')),
  CONSTRAINT menu_items_audience_key_key UNIQUE (audience, key)
);

CREATE TRIGGER menu_items_set_updated_at
  BEFORE UPDATE ON menu_items
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Sections a subadmin may use. Superadmins need no rows: they can use everything.
CREATE TABLE admin_permissions (
  user_id     uuid NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  section_key text NOT NULL,
  granted_by  uuid REFERENCES users (id) ON DELETE SET NULL,
  created_at  timestamptz NOT NULL DEFAULT now(),

  PRIMARY KEY (user_id, section_key)
);

INSERT INTO menu_items (audience, key, label, href, icon, exact_match, sort_order, is_system, superadmin_only) VALUES
  ('student', 'home',     'Головна',    '/cabinet',          'home',      true,  10, true, false),
  ('student', 'bases',    'Бази',       '/cabinet/bases',    'book-open', false, 20, true, false),
  ('student', 'booklets', 'Буклети',    '/cabinet/booklets', 'book',      false, 30, true, false),
  ('student', 'amps',     'АМПС',       '/cabinet/amps',     'amps',      false, 40, true, false),
  ('student', 'saved',    'Збережені',  '/cabinet/saved',    'saved',     false, 50, true, false),

  ('admin', 'subjects',   'Предмети',   '/admin',            'home',      true,  10, true, false),
  ('admin', 'bases',      'Бази',       '/admin/bases',      'book-open', false, 20, true, false),
  ('admin', 'booklets',   'Буклети',    '/admin/booklets',   'book',      false, 30, true, false),
  ('admin', 'amps',       'АМПС',       '/admin/amps',       'amps',      false, 40, true, false),
  ('admin', 'students',   'Студенти',   '/admin/students',   'students',  false, 50, true, false),
  ('admin', 'staff',      'Команда',    '/admin/staff',      'team',      false, 60, true, true),
  ('admin', 'menu',       'Меню',       '/admin/menu',       'menu',      false, 70, true, true);
