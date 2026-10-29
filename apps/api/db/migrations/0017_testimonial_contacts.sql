-- 0017_testimonial_contacts.sql
-- A testimonial carries a way to reach its author: an email (required) and a phone (optional).
-- Only admins ever see them; the public list never includes them.

ALTER TABLE testimonials
  ADD COLUMN author_email text,
  ADD COLUMN author_phone text;

-- Testimonials of signed-in authors that were written before this migration get the account email.
UPDATE testimonials t
SET author_email = u.email
FROM users u
WHERE u.id = t.user_id;

UPDATE testimonials SET author_email = '' WHERE author_email IS NULL;

ALTER TABLE testimonials ALTER COLUMN author_email SET NOT NULL;

-- Written one way only: +380 98 938 55 85 (the operator code never starts with 0).
ALTER TABLE testimonials ADD CONSTRAINT testimonials_phone_check
  CHECK (author_phone IS NULL OR author_phone ~ '^\+380 [1-9][0-9] [0-9]{3} [0-9]{2} [0-9]{2}$');
