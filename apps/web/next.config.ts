import path from 'node:path';

import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Self-contained server bundle for the production Docker image.
  output: 'standalone',
  // In a monorepo, tracing must start from the repository root so workspace packages are copied.
  outputFileTracingRoot: path.resolve(import.meta.dirname, '../..'),
  poweredByHeader: false,
};

export default nextConfig;
