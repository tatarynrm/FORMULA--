-- 0006_files_and_catalog.sql
-- Uploaded files and the learning catalog: subject -> topic -> subtopic (+ materials).

-- A fix to a built-in label (the admin root page is "Предмети і теми" in the design).
UPDATE menu_items SET label = 'Предмети і теми' WHERE audience = 'admin' AND key = 'subjects';

CREATE TABLE files (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id      uuid REFERENCES users (id) ON DELETE SET NULL,
  -- What the file is for; decides who may upload and read it.
  purpose       text NOT NULL,
  original_name text NOT NULL,
  mime_type     text NOT NULL,
  size_bytes    bigint NOT NULL,
  -- Path relative to the storage root. Never exposed to clients.
  storage_key   text NOT NULL UNIQUE,
  created_at    timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT files_purpose_check CHECK (purpose IN ('avatar', 'image', 'video', 'document'))
);

CREATE TABLE subjects (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title       text NOT NULL,
  description text,
  status      text NOT NULL DEFAULT 'draft',
  sort_order  integer NOT NULL DEFAULT 0,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT subjects_status_check CHECK (status IN ('draft', 'published'))
);

CREATE TABLE topics (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  subject_id  uuid NOT NULL REFERENCES subjects (id) ON DELETE CASCADE,
  title       text NOT NULL,
  status      text NOT NULL DEFAULT 'draft',
  sort_order  integer NOT NULL DEFAULT 0,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT topics_status_check CHECK (status IN ('draft', 'published'))
);
CREATE INDEX topics_subject_id_idx ON topics (subject_id, sort_order);

-- A subtopic is the unit a student opens and pays for. It holds materials and tests.
CREATE TABLE subtopics (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  topic_id         uuid NOT NULL REFERENCES topics (id) ON DELETE CASCADE,
  title            text NOT NULL,
  -- Rich text written in the editor, sanitized by the api before it is stored.
  description_html text NOT NULL DEFAULT '',
  -- Free subtopics are open to every student (trial lessons); the rest need an access grant.
  is_free          boolean NOT NULL DEFAULT false,
  status           text NOT NULL DEFAULT 'draft',
  sort_order       integer NOT NULL DEFAULT 0,
  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT subtopics_status_check CHECK (status IN ('draft', 'published'))
);
CREATE INDEX subtopics_topic_id_idx ON subtopics (topic_id, sort_order);

-- Videos (the file itself, not a link) and documents (PDF, Word, Excel) of a subtopic.
CREATE TABLE materials (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  subtopic_id uuid NOT NULL REFERENCES subtopics (id) ON DELETE CASCADE,
  kind        text NOT NULL,
  title       text NOT NULL,
  file_id     uuid NOT NULL REFERENCES files (id),
  sort_order  integer NOT NULL DEFAULT 0,
  created_at  timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT materials_kind_check CHECK (kind IN ('video', 'document'))
);
CREATE INDEX materials_subtopic_id_idx ON materials (subtopic_id, sort_order);

-- Who may open a paid subtopic. Payments will create these rows later; for now admins grant them.
CREATE TABLE subtopic_access (
  user_id     uuid NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  subtopic_id uuid NOT NULL REFERENCES subtopics (id) ON DELETE CASCADE,
  source      text NOT NULL DEFAULT 'manual',
  granted_by  uuid REFERENCES users (id) ON DELETE SET NULL,
  expires_at  timestamptz,
  created_at  timestamptz NOT NULL DEFAULT now(),

  PRIMARY KEY (user_id, subtopic_id),
  CONSTRAINT subtopic_access_source_check CHECK (source IN ('manual', 'payment'))
);

CREATE TRIGGER subjects_set_updated_at BEFORE UPDATE ON subjects FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER topics_set_updated_at BEFORE UPDATE ON topics FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER subtopics_set_updated_at BEFORE UPDATE ON subtopics FOR EACH ROW EXECUTE FUNCTION set_updated_at();
