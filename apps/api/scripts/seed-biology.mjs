// Fills the platform with a demo subject "Біологія": topics, subtopics with descriptions, PDF cheat
// sheets and tests of both kinds, so there is something to practise on. Idempotent enough for a
// dev database: a subject with the same title is reused, its topics with the same titles too.
//
// Usage: npm run seed:biology -w @formula/api -- [--grant=mail1@x.com,mail2@x.com]
//   --grant opens the whole subject for those students (admins open it for others in the panel).
// Needs: the api on API_URL (default http://localhost:4000), Docker postgres, Google Chrome (PDFs).
import { execFileSync, execSync } from 'node:child_process';
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

import { CONTENT } from './seed-biology.content.mjs';

const API = `${process.env.API_URL ?? 'http://localhost:4000'}/api/v1`;
const REPO = fileURLToPath(new URL('../../../', import.meta.url));
const CHROME = [
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  '/usr/bin/google-chrome',
  '/usr/bin/chromium',
].find((candidate) => existsSync(candidate));
const grantArgument = process.argv.find((argument) => argument.startsWith('--grant='));
const GRANT_EMAILS = grantArgument
  ? grantArgument
      .slice('--grant='.length)
      .split(',')
      .map((email) => email.trim().toLowerCase())
      .filter(Boolean)
  : [];

const stamp = Date.now().toString(36);
const ADMIN_EMAIL = `seed.admin.${stamp}@example.com`;
const ADMIN_PASSWORD = `seed-${stamp}-password`;

// ---------- a tiny api client ----------
const jar = new Map();
/** JSON request; pass a `FormData` as the body to upload a file instead. */
async function call(method, path, body) {
  const cookie = [...jar].map(([k, v]) => `${k}=${v}`).join('; ');
  const isJson = body !== undefined && !(body instanceof FormData);
  const response = await fetch(`${API}${path}`, {
    method,
    headers: {
      ...(cookie ? { cookie } : {}),
      ...(isJson ? { 'content-type': 'application/json' } : {}),
    },
    body: isJson ? JSON.stringify(body) : body,
  });
  for (const line of response.headers.getSetCookie?.() ?? []) {
    const [pair] = line.split(';');
    const [name, ...rest] = pair.split('=');
    jar.set(name, rest.join('='));
  }
  const result = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(
      `${method} ${path} -> ${response.status} ${JSON.stringify(result?.error ?? result).slice(0, 300)}`,
    );
  }
  return result.data;
}

// ---------- PDF cheat sheets through headless Chrome ----------
const workDir = mkdtempSync(join(tmpdir(), 'formula-seed-'));

function cheatSheetPdf(title, html) {
  if (!CHROME) return null;
  const page = join(workDir, `${Math.random().toString(36).slice(2)}.html`);
  const pdf = page.replace(/\.html$/, '.pdf');
  writeFileSync(
    page,
    `<!doctype html><html lang="uk"><head><meta charset="utf-8"><title>${title}</title>
<style>
  body { font-family: "Segoe UI", Arial, sans-serif; color: #1f2330; margin: 32px 40px; line-height: 1.5; }
  h1 { font-size: 24px; margin: 0 0 4px; } h2 { font-size: 16px; margin: 20px 0 6px; color: #d64a7a; }
  .brand { color: #d64a7a; font-weight: 700; letter-spacing: .08em; font-size: 12px; text-transform: uppercase; }
  table { border-collapse: collapse; width: 100%; font-size: 13px; } td, th { border: 1px solid #d9dde8; padding: 6px 8px; text-align: left; }
  th { background: #f3f5fa; } ul { padding-left: 20px; } li { margin: 2px 0; } p { margin: 6px 0; }
  .note { background: #fdf1f5; border-left: 4px solid #d64a7a; padding: 8px 12px; margin: 12px 0; }
</style></head><body><div class="brand">Formula · шпаргалка</div><h1>${title}</h1>${html}</body></html>`,
  );
  execFileSync(
    CHROME,
    [
      '--headless=new',
      '--disable-gpu',
      '--no-pdf-header-footer',
      `--print-to-pdf=${pdf}`,
      pathToFileURL(page).href,
    ],
    { stdio: 'ignore', timeout: 60_000 },
  );
  return readFileSync(pdf);
}

async function uploadDocument(name, bytes) {
  const form = new FormData();
  form.append('file', new Blob([bytes], { type: 'application/pdf' }), name);
  return call('POST', '/uploads?purpose=document', form);
}

// ---------- seeding ----------
async function findOrCreateSubject() {
  const existing = (await call('GET', '/admin/subjects')).find(
    (subject) => subject.title === CONTENT.subject.title,
  );
  if (existing) {
    console.log(`Subject "${CONTENT.subject.title}" exists, adding to it`);
    return existing.id;
  }
  const created = await call('POST', '/admin/subjects', {
    title: CONTENT.subject.title,
    description: CONTENT.subject.description,
  });
  return created.id;
}

async function seedTopic(subjectId, topic) {
  const tree = await call('GET', `/admin/subjects/${subjectId}`);
  let stored = tree.topics.find((item) => item.title === topic.title);
  if (!stored) {
    const updated = await call('POST', `/admin/subjects/${subjectId}/topics`, {
      title: topic.title,
    });
    stored = updated.topics.find((item) => item.title === topic.title);
  }
  console.log(`\n${topic.title}`);

  for (const subtopic of topic.subtopics) {
    const already = stored.subtopics?.find((item) => item.title === subtopic.title);
    if (already) {
      console.log(`  = ${subtopic.title} (exists, skipped)`);
      continue;
    }
    const { id } = await call('POST', `/admin/topics/${stored.id}/subtopics`, {
      title: subtopic.title,
      isFree: subtopic.free,
    });
    await call('PATCH', `/admin/subtopics/${id}`, { descriptionHtml: subtopic.description });

    if (subtopic.cheatSheet) {
      const bytes = cheatSheetPdf(subtopic.cheatSheet.title, subtopic.cheatSheet.html);
      if (bytes) {
        const file = await uploadDocument(`${subtopic.cheatSheet.title}.pdf`, bytes);
        await call('POST', `/admin/subtopics/${id}/materials`, {
          kind: 'document',
          title: subtopic.cheatSheet.title,
          fileId: file.id,
        });
      }
    }

    const test = await call('POST', '/admin/tests', {
      kind: subtopic.test.kind,
      collection: 'subtopic',
      subtopicId: id,
      title: subtopic.test.kind === 'choice' ? 'Тест з варіантами відповідей' : 'Ситуаційні задачі',
      ...(subtopic.test.timeLimitSeconds
        ? { timeLimitSeconds: subtopic.test.timeLimitSeconds }
        : {}),
    });
    await call('PUT', `/admin/tests/${test.id}/questions`, { questions: subtopic.test.questions });
    await call('PATCH', `/admin/tests/${test.id}`, { status: 'published' });
    await call('PATCH', `/admin/subtopics/${id}`, { status: 'published' });
    console.log(
      `  + ${subtopic.title} (${subtopic.free ? 'безкоштовна' : 'платна'}, ${subtopic.test.questions.length} ${subtopic.test.kind === 'choice' ? 'питань з варіантами' : 'ситуаційних задач'}${subtopic.cheatSheet && CHROME ? ', PDF' : ''})`,
    );
  }
  await call('PATCH', `/admin/topics/${stored.id}`, { status: 'published' });
}

async function grantSubject(subjectId) {
  if (GRANT_EMAILS.length === 0) return;
  const students = (await call('GET', '/admin/students?limit=100')).filter((student) =>
    GRANT_EMAILS.includes(student.email),
  );
  for (const student of students) {
    await call('PUT', `/admin/students/${student.id}/subject-access/${subjectId}`);
    console.log(`Access to the whole subject: ${student.email}`);
  }
  for (const email of GRANT_EMAILS) {
    if (!students.some((student) => student.email === email))
      console.log(`No student with email ${email} (skipped)`);
  }
}

function sql(statement) {
  execSync('docker compose exec -T postgres psql -U formula -d formula', {
    cwd: REPO,
    input: statement,
    stdio: ['pipe', 'pipe', 'pipe'],
  });
}

try {
  await call('POST', '/auth/register', {
    name: 'Seed',
    surname: 'Admin',
    email: ADMIN_EMAIL,
    password: ADMIN_PASSWORD,
  });
  execSync(`npm run user:set-role -w @formula/api -- ${ADMIN_EMAIL} admin`, {
    cwd: REPO,
    stdio: 'pipe',
  });
  await call('POST', '/auth/login', { email: ADMIN_EMAIL, password: ADMIN_PASSWORD });
  if (!CHROME) console.log('Google Chrome not found: the PDF cheat sheets are skipped');

  const subjectId = await findOrCreateSubject();
  for (const topic of CONTENT.topics) await seedTopic(subjectId, topic);
  await call('PATCH', `/admin/subjects/${subjectId}`, { status: 'published' });
  await grantSubject(subjectId);

  console.log(`\nDone: "${CONTENT.subject.title}" is published.`);
} finally {
  rmSync(workDir, { recursive: true, force: true });
  // The temporary admin leaves; the content stays (its "created by" becomes empty).
  try {
    sql(`DELETE FROM users WHERE email = '${ADMIN_EMAIL}';`);
  } catch (error) {
    console.log(
      `Could not remove the temporary admin ${ADMIN_EMAIL}: ${String(error).slice(0, 200)}`,
    );
  }
}
