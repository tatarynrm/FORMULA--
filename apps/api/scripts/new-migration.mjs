// Usage: npm run db:new -w @formula/api -- create_users_table
import { mkdir, readdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const MIGRATIONS_DIR = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '../db/migrations',
);

const rawName = process.argv[2];
if (!rawName) {
  console.error('Usage: npm run db:new -w @formula/api -- <snake_case_name>');
  process.exit(1);
}

const name = rawName
  .trim()
  .toLowerCase()
  .replace(/[^a-z0-9]+/g, '_')
  .replace(/^_+|_+$/g, '');

await mkdir(MIGRATIONS_DIR, { recursive: true });
const existing = (await readdir(MIGRATIONS_DIR))
  .filter((file) => /^\d{4}_.+\.sql$/.test(file))
  .sort();
const lastNumber = existing.length ? Number(existing[existing.length - 1].slice(0, 4)) : 0;
const fileName = `${String(lastNumber + 1).padStart(4, '0')}_${name}.sql`;

await writeFile(
  path.join(MIGRATIONS_DIR, fileName),
  `-- ${fileName}\n-- Write plain SQL. The runner wraps this file in a transaction.\n\n`,
);

console.log(`Created db/migrations/${fileName}`);
