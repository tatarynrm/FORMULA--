import globals from 'globals';

import { baseConfig } from './base.mjs';

/** Flat config for the NestJS app. */
export const nestConfig = [
  ...baseConfig,
  {
    languageOptions: {
      globals: { ...globals.node, ...globals.jest },
    },
    rules: {
      // Nest relies on runtime imports for DI tokens, so value imports must stay value imports.
      '@typescript-eslint/consistent-type-imports': 'off',
    },
  },
];

export default nestConfig;
