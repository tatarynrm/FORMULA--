-- 0007_tests_attempts_favorites.sql
-- Tests (with answer options or situational), their questions, attempts and favorites.

-- One table for every kind of test collection: the tests of a subtopic and the "bases",
-- "booklets" and "AMPS" lists share the same questions and attempts.
CREATE TABLE tests (
  id                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  -- 'choice': pick answer options, graded at once. 'situational': write an answer, graded by an admin.
  kind               text NOT NULL,
  collection         text NOT NULL,
  subtopic_id        uuid REFERENCES subtopics (id) ON DELETE CASCADE,
  title              text NOT NULL,
  description        text,
  -- Filters of the bases / booklets / AMPS lists.
  category           text,
  year               integer,
  specialty          text,
  status             text NOT NULL DEFAULT 'draft',
  -- Total time for all questions, set by the admin. The student may refuse the limit.
  time_limit_seconds integer,
  sort_order         integer NOT NULL DEFAULT 0,
  created_by         uuid REFERENCES users (id) ON DELETE SET NULL,
  created_at         timestamptz NOT NULL DEFAULT now(),
  updated_at         timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT tests_kind_check CHECK (kind IN ('choice', 'situational')),
  CONSTRAINT tests_collection_check CHECK (collection IN ('subtopic', 'base', 'booklet', 'amps')),
  CONSTRAINT tests_status_check CHECK (status IN ('draft', 'published')),
  CONSTRAINT tests_time_limit_check CHECK (time_limit_seconds IS NULL OR time_limit_seconds > 0),
  -- A test belongs to a subtopic exactly when its collection is 'subtopic'.
  CONSTRAINT tests_subtopic_check CHECK ((collection = 'subtopic') = (subtopic_id IS NOT NULL))
);
CREATE INDEX tests_subtopic_id_idx ON tests (subtopic_id, sort_order);
CREATE INDEX tests_collection_idx ON tests (collection, status);

CREATE TABLE questions (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  test_id          uuid NOT NULL REFERENCES tests (id) ON DELETE CASCADE,
  position         integer NOT NULL,
  body             text NOT NULL,
  image_file_id    uuid REFERENCES files (id) ON DELETE SET NULL,
  -- Choice tests: shown after the answer. Situational: model answer shown after the review.
  explanation      text,
  -- Situational questions: points an admin can give.
  max_score        integer NOT NULL DEFAULT 1,
  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT questions_position_key UNIQUE (test_id, position) DEFERRABLE INITIALLY DEFERRED,
  CONSTRAINT questions_max_score_check CHECK (max_score > 0)
);

-- Answer options of a choice question. The letter (A, B, C...) comes from the position.
CREATE TABLE question_options (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  question_id   uuid NOT NULL REFERENCES questions (id) ON DELETE CASCADE,
  position      integer NOT NULL,
  body          text NOT NULL,
  image_file_id uuid REFERENCES files (id) ON DELETE SET NULL,
  -- Why this option is right or wrong.
  explanation   text,
  is_correct    boolean NOT NULL DEFAULT false,

  CONSTRAINT question_options_position_key UNIQUE (question_id, position) DEFERRABLE INITIALLY DEFERRED
);

CREATE TABLE attempts (
  id                   uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id              uuid NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  test_id              uuid NOT NULL REFERENCES tests (id) ON DELETE CASCADE,
  -- in_progress -> completed (choice tests) | pending_review -> reviewed (situational tests)
  status               text NOT NULL DEFAULT 'in_progress',
  -- The student's choices at the start.
  timed                boolean NOT NULL DEFAULT false,
  time_limit_seconds   integer,
  explanations_enabled boolean NOT NULL DEFAULT false,
  started_at           timestamptz NOT NULL DEFAULT now(),
  finished_at          timestamptz,
  reviewed_at          timestamptz,
  reviewed_by          uuid REFERENCES users (id) ON DELETE SET NULL,
  -- Filled when graded.
  score                numeric(8, 2),
  max_score            numeric(8, 2),
  correct_count        integer,
  total_count          integer,

  CONSTRAINT attempts_status_check CHECK (status IN ('in_progress', 'completed', 'pending_review', 'reviewed'))
);
CREATE INDEX attempts_user_test_idx ON attempts (user_id, test_id, started_at DESC);
CREATE INDEX attempts_review_idx ON attempts (status) WHERE status = 'pending_review';

CREATE TABLE attempt_answers (
  attempt_id          uuid NOT NULL REFERENCES attempts (id) ON DELETE CASCADE,
  question_id         uuid NOT NULL REFERENCES questions (id) ON DELETE CASCADE,
  -- Choice questions: the picked options. Situational: empty.
  selected_option_ids uuid[] NOT NULL DEFAULT '{}',
  text_answer         text,
  is_correct          boolean,
  score               numeric(8, 2),
  reviewer_comment    text,
  answered_at         timestamptz NOT NULL DEFAULT now(),

  PRIMARY KEY (attempt_id, question_id)
);

-- "Saved" tab of a student: any test (subtopic test, base, booklet, AMPS).
CREATE TABLE favorites (
  user_id    uuid NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  test_id    uuid NOT NULL REFERENCES tests (id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),

  PRIMARY KEY (user_id, test_id)
);

CREATE TRIGGER tests_set_updated_at BEFORE UPDATE ON tests FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER questions_set_updated_at BEFORE UPDATE ON questions FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- A section for grading situational answers, grantable to subadmins like the others.
INSERT INTO menu_items (audience, key, label, href, icon, exact_match, sort_order, is_system, superadmin_only)
VALUES ('admin', 'reviews', 'Перевірка', '/admin/reviews', 'test', false, 45, true, false);
