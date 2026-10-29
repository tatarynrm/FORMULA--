-- 0019_file_links_without_api_version.sql
-- The api no longer has a version in its URLs: files are opened at /api/files/:id instead of
-- /api/v1/files/:id. Images inside rich text (subtopic descriptions and text pages of the menu)
-- store the full link, so the stored html is rewritten; otherwise those pictures would break.
-- Both relative (/api/v1/files/..) and absolute (https://domain/api/v1/files/..) links are covered.

UPDATE subtopics
SET description_html = replace(description_html, '/api/v1/files/', '/api/files/')
WHERE description_html LIKE '%/api/v1/files/%';

UPDATE menu_pages
SET body_html = replace(body_html, '/api/v1/files/', '/api/files/')
WHERE body_html LIKE '%/api/v1/files/%';
