import { nextConfig } from '@formula/config/eslint/next';

const config = [
  ...nextConfig,
  // shadcn/ui output is vendored; keep it lint-quiet.
  { ignores: ['src/components/ui/**'] },
];

export default config;
