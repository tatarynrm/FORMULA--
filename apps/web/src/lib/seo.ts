import type { Metadata } from 'next';

import { SITE_NAME } from './site';

interface PageMetadataInput {
  /** Page title without the site name: the layout template adds ` | Formula`. */
  title: string;
  description: string;
  /** Path of the page on the site, e.g. `/privacy`. */
  path: string;
  /** `false` keeps the page out of the canonical/sitemap story (sign-in, sign-up). Default `true`. */
  index?: boolean;
  /** Use `title` as is, without the ` | Formula` suffix (the home page). */
  absoluteTitle?: boolean;
}

/**
 * Title, description, canonical, Open Graph and Twitter card of one public page.
 *
 * Next.js replaces a parent's `openGraph` object as a whole when a page defines its own, so every
 * page that sets one must repeat locale, site name and url. This helper does that in one place.
 * The preview picture is not set here: it is the `opengraph-image` / `twitter-image` file that lies
 * next to the page (apps/web/src/app/.../opengraph-image.png), which Next.js adds to the tags.
 */
export function createPageMetadata({
  title,
  description,
  path,
  index = true,
  absoluteTitle = false,
}: PageMetadataInput): Metadata {
  const shareTitle = absoluteTitle ? title : `${title} | ${SITE_NAME}`;

  return {
    title: absoluteTitle ? { absolute: title } : title,
    description,
    // Pages that are not indexed get no canonical: it would point search engines at a page
    // the owner does not want in results.
    ...(index ? { alternates: { canonical: path } } : {}),
    openGraph: {
      type: 'website',
      locale: 'uk_UA',
      siteName: SITE_NAME,
      url: path,
      title: shareTitle,
      description,
    },
    twitter: {
      card: 'summary_large_image',
      title: shareTitle,
      description,
    },
  };
}
