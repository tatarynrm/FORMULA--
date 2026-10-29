// Dev runner: builds once, then keeps `tsc --watch` and `node --watch` running side by side.
// tsc is required (instead of esbuild-based runners) because Nest DI needs emitDecoratorMetadata.
import { spawn, spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const tscBin = require.resolve('typescript/bin/tsc');
const tscArgs = [tscBin, '-p', 'tsconfig.build.json'];

const initial = spawnSync(process.execPath, tscArgs, { stdio: 'inherit' });
if (initial.status !== 0) {
  console.error('Initial build failed. Fix the errors above, then rerun.');
  process.exit(initial.status ?? 1);
}

// `node --watch` only follows imported files, so .env changes (DATABASE_URL, secrets) would be
// ignored until a manual restart. Watching .env explicitly makes the api restart on edit.
const watchPaths = ['./dist', ...(existsSync('.env') ? ['./.env'] : [])].map(
  (path) => `--watch-path=${path}`,
);

const children = [
  spawn(process.execPath, [...tscArgs, '--watch', '--preserveWatchOutput'], { stdio: 'inherit' }),
  spawn(process.execPath, ['--watch', ...watchPaths, '--watch-preserve-output', 'dist/main.js'], {
    stdio: 'inherit',
  }),
];

const stop = () => children.forEach((child) => child.kill());
process.on('SIGINT', stop);
process.on('SIGTERM', stop);
children.forEach((child) =>
  child.on('exit', (code) => {
    stop();
    process.exit(code ?? 0);
  }),
);
