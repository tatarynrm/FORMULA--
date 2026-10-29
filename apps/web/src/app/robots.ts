import type { MetadataRoute } from 'next';

import { SITE_URL, absoluteUrl } from '@/lib/site';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        // Private or useless for search: student cabinet, admin panel, auth pages, the api.
        disallow: ['/cabinet', '/admin', '/login', '/register', '/onboarding', '/api/'],
      },
    ],
    sitemap: absoluteUrl('/sitemap.xml'),
    host: SITE_URL,
  };
}
