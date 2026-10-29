import { nestConfig } from '@formula/config/eslint/nest';

export default [
  ...nestConfig,
  // CLI scripts print to stdout on purpose.
  { files: ['scripts/**'], rules: { 'no-console': 'off' } },
];
