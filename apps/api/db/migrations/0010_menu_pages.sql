-- 0010_menu_pages.sql
-- A superadmin can add a section to a menu in two ways: a plain link, or a page with its own content
-- written in the rich text editor. The content of a page lives here, next to its menu item.

ALTER TABLE menu_items
  ADD COLUMN kind text NOT NULL DEFAULT 'link',
  ADD CONSTRAINT menu_items_kind_check CHECK (kind IN ('link', 'page'));

CREATE TABLE menu_pages (
  menu_item_id uuid PRIMARY KEY REFERENCES menu_items (id) ON DELETE CASCADE,
  -- Rich text, sanitized by the api before it is stored.
  body_html    text NOT NULL DEFAULT '',
  updated_by   uuid REFERENCES users (id) ON DELETE SET NULL,
  updated_at   timestamptz NOT NULL DEFAULT now()
);
