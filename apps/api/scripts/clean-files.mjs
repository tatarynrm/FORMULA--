// Removes uploaded files that nothing uses any more:
//   * records in `files` that no material, question, option, avatar or rich text refers to;
//   * bytes in the storage folder that have no record (a failed or interrupted upload).
// Files younger than the grace period are never touched, because an upload may still be waiting to be
// attached to something. It only lists what it would delete unless you pass --apply.
//
// Usage: npm run files:cleanup -w @formula/api [-- --apply] [--grace-hours=24]
import { readdir, rm, stat } from 'node:fs/promises';
import { join, relative, resolve, sep } from 'node:path';
import pg from 'pg';

const apply = process.argv.includes('--apply');
const graceArgument = process.argv.find((argument) => argument.startsWith('--grace-hours='));
const graceHours = graceArgument ? Number(graceArgument.split('=')[1]) : 24;

if (!Number.isFinite(graceHours) || graceHours < 0) {
  console.error('--grace-hours must be a number of hours (0 or more)');
  process.exit(1);
}
if (!process.env.DATABASE_URL) {
  console.error('DATABASE_URL is not set (see apps/api/.env.example)');
  process.exit(1);
}

const storageDir = resolve(process.env.STORAGE_DIR ?? './storage');
const graceMs = graceHours * 60 * 60 * 1000;
const client = new pg.Client({ connectionString: process.env.DATABASE_URL });

/** Every file under `directory`, as paths relative to the storage root with forward slashes. */
async function listFiles(directory) {
  const found = [];
  let entries;
  try {
    entries = await readdir(directory, { withFileTypes: true });
  } catch {
    return found;
  }
  for (const entry of entries) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) found.push(...(await listFiles(path)));
    else found.push(relative(storageDir, path).split(sep).join('/'));
  }
  return found;
}

try {
  await client.connect();
  const mode = apply ? 'DELETING' : 'dry run (add --apply to delete)';
  console.log(`Storage: ${storageDir}\nGrace period: ${graceHours} h\nMode: ${mode}\n`);

  // 1. Records nobody refers to.
  const unused = await client.query(
    `SELECT f.id, f.storage_key, f.purpose, f.original_name
     FROM files f
     WHERE f.created_at < now() - ($1::int * interval '1 hour')
       AND NOT EXISTS (SELECT 1 FROM materials m WHERE m.file_id = f.id)
       AND NOT EXISTS (SELECT 1 FROM questions q WHERE q.image_file_id = f.id)
       AND NOT EXISTS (SELECT 1 FROM question_options o WHERE o.image_file_id = f.id)
       AND NOT EXISTS (SELECT 1 FROM user_profiles p WHERE p.avatar_file_id = f.id)
       AND NOT EXISTS (SELECT 1 FROM chat_messages cm WHERE cm.image_file_id = f.id)
       AND NOT EXISTS (SELECT 1 FROM subtopics s WHERE position(f.id::text in s.description_html) > 0)
       AND NOT EXISTS (SELECT 1 FROM menu_pages mp WHERE position(f.id::text in mp.body_html) > 0)
     ORDER BY f.created_at`,
    [Math.floor(graceHours)],
  );

  console.log(`Unused file records: ${unused.rowCount}`);
  for (const row of unused.rows) {
    console.log(`  ${row.purpose.padEnd(8)} ${row.storage_key}  (${row.original_name})`);
    if (apply) {
      await client.query('DELETE FROM files WHERE id = $1', [row.id]);
      await rm(join(storageDir, row.storage_key), { force: true });
    }
  }

  // 2. Bytes without a record.
  const known = new Set(
    (await client.query('SELECT storage_key FROM files')).rows.map((row) => row.storage_key),
  );
  const onDisk = await listFiles(storageDir);
  const loose = [];
  for (const key of onDisk) {
    if (known.has(key)) continue;
    const { mtimeMs } = await stat(join(storageDir, key));
    if (Date.now() - mtimeMs >= graceMs) loose.push(key);
  }

  console.log(`\nFiles on disk without a record: ${loose.length}`);
  for (const key of loose) {
    console.log(`  ${key}`);
    if (apply) await rm(join(storageDir, key), { force: true });
  }

  console.log(apply ? '\nDone.' : '\nNothing was deleted (dry run).');
} finally {
  await client.end();
}
