-- 0011_subject_access_and_test_categories.sql
-- 1) Access can be opened for a whole subject, not only for single subtopics.
-- 2) A subtopic has at most one test per category: choice ("З варіантами відповідей") and
--    situational ("Ситуаційні задачі"), exactly as in the product spec.

-- Access to a whole subject: every subtopic of it, including the ones added later.
CREATE TABLE subject_access (
  user_id    uuid NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  subject_id uuid NOT NULL REFERENCES subjects (id) ON DELETE CASCADE,
  source     text NOT NULL DEFAULT 'manual',
  granted_by uuid REFERENCES users (id) ON DELETE SET NULL,
  expires_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),

  PRIMARY KEY (user_id, subject_id),
  CONSTRAINT subject_access_source_check CHECK (source IN ('manual', 'payment'))
);
CREATE INDEX subject_access_subject_id_idx ON subject_access (subject_id);

-- The one place that answers "may this student open this subtopic?". Free subtopics, a grant on the
-- subtopic itself and a grant on its whole subject all count (a grant that has expired does not).
-- Repositories call it, so the rule cannot drift between the catalog, files, tests and progress.
CREATE FUNCTION has_subtopic_access(p_user_id uuid, p_subtopic_id uuid) RETURNS boolean
LANGUAGE sql STABLE AS $$
  SELECT
    EXISTS (
      SELECT 1 FROM subtopics s WHERE s.id = p_subtopic_id AND s.is_free
    )
    OR EXISTS (
      SELECT 1 FROM subtopic_access a
      WHERE a.subtopic_id = p_subtopic_id AND a.user_id = p_user_id
        AND (a.expires_at IS NULL OR a.expires_at > now())
    )
    OR EXISTS (
      SELECT 1
      FROM subtopics s
      JOIN topics t ON t.id = s.topic_id
      JOIN subject_access sa ON sa.subject_id = t.subject_id
      WHERE s.id = p_subtopic_id AND sa.user_id = p_user_id
        AND (sa.expires_at IS NULL OR sa.expires_at > now())
    )
$$;

-- One test per category in a subtopic. The admin adds questions to the category directly, so the
-- test is created behind the scenes and a second one of the same kind must never appear.
CREATE UNIQUE INDEX tests_subtopic_kind_key ON tests (subtopic_id, kind) WHERE collection = 'subtopic';
