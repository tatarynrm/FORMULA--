// Plain-SQL migration runner. Applies db/migrations/*.sql in filename order, each in its own
// transaction, and records them in the schema_migrations table. No ORM involved.
import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import pg from 'pg';

const MIGRATIONS_DIR = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '../db/migrations',
);
const ADVISORY_LOCK_ID = 727_001;

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  console.error('DATABASE_URL is not set (see apps/api/.env.example)');
  process.exit(1);
}

const client = new pg.Client({ connectionString: databaseUrl });

async function main() {
  await client.connect();
  await client.query('SELECT pg_advisory_lock($1)', [ADVISORY_LOCK_ID]);

  await client.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      name       text PRIMARY KEY,
      applied_at timestamptz NOT NULL DEFAULT now()
    )
  `);

  const applied = new Set(
    (await client.query('SELECT name FROM schema_migrations')).rows.map((row) => row.name),
  );

  const files = (await readdir(MIGRATIONS_DIR)).filter((file) => file.endsWith('.sql')).sort();
  const pending = files.filter((file) => !applied.has(file));

  if (pending.length === 0) {
    console.log('Database is up to date.');
    return;
  }

  for (const file of pending) {
    const sql = await readFile(path.join(MIGRATIONS_DIR, file), 'utf8');
    process.stdout.write(`Applying ${file} ... `);
    try {
      await client.query('BEGIN');
      await client.query(sql);
      await client.query('INSERT INTO schema_migrations (name) VALUES ($1)', [file]);
      await client.query('COMMIT');
      console.log('done');
    } catch (error) {
      await client.query('ROLLBACK');
      console.log('failed');
      throw error;
    }
  }

  console.log(`Applied ${pending.length} migration(s).`);
}

try {
  await main();
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
} finally {
  await client.end();
}
