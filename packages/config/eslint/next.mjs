import nextVitals from 'eslint-config-next/core-web-vitals';
import nextTs from 'eslint-config-next/typescript';
import prettier from 'eslint-config-prettier';

import { baseConfig } from './base.mjs';

/** Flat config for the Next.js app. */
export const nextConfig = [
  ...baseConfig,
  ...nextVitals,
  ...nextTs,
  {
    rules: {
      '@typescript-eslint/no-explicit-any': 'error',
    },
  },
  prettier,
];

export default nextConfig;
