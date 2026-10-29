import type { Metadata, Viewport } from 'next';
import { DM_Sans, Onest } from 'next/font/google';
import type { ReactNode } from 'react';

import { env } from '@/lib/env';
import { SITE_NAME, SITE_URL } from '@/lib/site';
import { t } from '@/locales';
import { AppProviders } from '@/providers/app-providers';

import './globals.css';

// Design font from Figma. DM Sans has no Cyrillic glyphs, so Onest (a similar geometric sans)
// covers Ukrainian text through the font-family fallback chain defined in globals.css.
// TODO: sync with Figma (swap Onest if a Cyrillic-capable brand font is chosen).
const dmSans = DM_Sans({
  subsets: ['latin', 'latin-ext'],
  variable: '--font-dm-sans',
  display: 'swap',
});

const onest = Onest({
  subsets: ['cyrillic', 'cyrillic-ext', 'latin'],
  variable: '--font-onest',
  display: 'swap',
});

// Site-wide defaults for search engines and link previews. They describe the home page, which
// inherits them (preview picture: app/opengraph-image.png and app/twitter-image.png).
// Other shareable pages (privacy, sign-in, sign-up) set their own title, canonical, url and
// preview through `createPageMetadata` (lib/seo.ts) with an `opengraph-image` file next to the
// page; private areas (cabinet, admin) opt out with `robots: { index: false }`.
// There is deliberately no site-wide `canonical`: every page would inherit it and claim to be the
// home page.
export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: t.meta.title, template: `%s | ${SITE_NAME}` },
  description: t.meta.description,
  keywords: [...t.meta.keywords],
  applicationName: SITE_NAME,
  authors: [{ name: SITE_NAME, url: SITE_URL }],
  creator: SITE_NAME,
  publisher: SITE_NAME,
  category: 'education',
  openGraph: {
    type: 'website',
    locale: 'uk_UA',
    siteName: SITE_NAME,
    url: '/',
    title: t.meta.title,
    description: t.meta.description,
  },
  twitter: {
    card: 'summary_large_image',
    title: t.meta.title,
    description: t.meta.description,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, 'max-image-preview': 'large', 'max-snippet': -1 },
  },
  formatDetection: { telephone: false, email: false, address: false },
  verification: env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION
    ? { google: env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION }
    : undefined,
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#D9E9F5',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="uk" suppressHydrationWarning className={`${dmSans.variable} ${onest.variable}`}>
      {/* Browser extensions (e.g. WOT) add attributes to <body> before React hydrates. */}
      <body suppressHydrationWarning>
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
