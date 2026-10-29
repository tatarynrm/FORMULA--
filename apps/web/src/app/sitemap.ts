import type { MetadataRoute } from 'next';

import { absoluteUrl } from '@/lib/site';

// Only public, indexable pages. Section anchors (/#faq) are not separate URLs, so they are not listed.
export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: absoluteUrl('/'), changeFrequency: 'weekly', priority: 1 },
    { url: absoluteUrl('/privacy'), changeFrequency: 'yearly', priority: 0.2 },
  ];
}
