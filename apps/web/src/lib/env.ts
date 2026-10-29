import { z } from 'zod';

const envSchema = z.object({
  NEXT_PUBLIC_SITE_URL: z.url().default('http://localhost:3000'),
  NEXT_PUBLIC_API_URL: z.url().default('http://localhost:4000/api'),
  // Token from Google Search Console (HTML tag method). Optional.
  NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION: z.string().optional(),
});

// Next.js inlines NEXT_PUBLIC_* only for direct property access, so each key is listed explicitly.
export const env = envSchema.parse({
  NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
  NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
  NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION:
    process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION || undefined,
});
