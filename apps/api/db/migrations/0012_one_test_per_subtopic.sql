-- 0012_one_test_per_subtopic.sql
-- A subtopic has ONE test, and the admin chooses its kind when creating it: either questions with
-- answer options (graded at once) or questions with a written answer (reviewed by an admin).
-- Until now a subtopic could hold one test of each kind.

DROP INDEX IF EXISTS tests_subtopic_kind_key;

-- No subtopic has two tests yet (the platform is not live), so the stricter index can be created.
CREATE UNIQUE INDEX tests_subtopic_key ON tests (subtopic_id) WHERE collection = 'subtopic';
