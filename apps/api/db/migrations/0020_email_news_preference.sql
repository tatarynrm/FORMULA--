-- 0020_email_news_preference.sql
-- Whether a person wants the admin's news by email. On by default; every news email carries an
-- unsubscribe link that switches it off. Service emails (welcome, password) ignore it.

ALTER TABLE users
  ADD COLUMN email_news_enabled boolean NOT NULL DEFAULT true;
