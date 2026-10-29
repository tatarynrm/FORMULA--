// Gives or takes away admin rights. Admins live in their own table (`admins`), users stay users.
//   admin     -> superadmin (every section)
//   subadmin  -> limited admin (give them sections in the admin panel afterwards)
//   student   -> removes the admin row (and with it every permission)
// Usage: npm run user:set-role -w @formula/api -- someone@example.com admin
import pg from 'pg';

const [email, role] = process.argv.slice(2);
const ROLES = ['student', 'admin', 'subadmin'];

if (!email || !ROLES.includes(role)) {
  console.error(`Usage: npm run user:set-role -w @formula/api -- <email> <${ROLES.join('|')}>`);
  process.exit(1);
}

if (!process.env.DATABASE_URL) {
  console.error('DATABASE_URL is not set (see apps/api/.env.example)');
  process.exit(1);
}

const client = new pg.Client({ connectionString: process.env.DATABASE_URL });

try {
  await client.connect();

  const user = await client.query('SELECT id, email FROM users WHERE email = $1', [
    email.trim().toLowerCase(),
  ]);
  if (user.rowCount === 0) {
    console.error(`No user with email ${email}`);
    process.exitCode = 1;
  } else {
    const { id, email: found } = user.rows[0];

    if (role === 'student') {
      await client.query('DELETE FROM admins WHERE user_id = $1', [id]);
      console.log(`${found} is now a student`);
    } else {
      const level = role === 'admin' ? 'superadmin' : 'subadmin';
      await client.query(
        `INSERT INTO admins (user_id, level) VALUES ($1, $2)
         ON CONFLICT (user_id) DO UPDATE SET level = EXCLUDED.level`,
        [id, level],
      );
      console.log(`${found} is now ${level}`);
    }
  }
} finally {
  await client.end();
}
