import { SITE_URL, absoluteUrl } from '@/lib/site';
import { t } from '@/locales';

/** schema.org WebPage + BreadcrumbList for /privacy. Texts come from the same dictionary as the page. */
export function getPrivacyStructuredData(): Record<string, unknown> {
  const url = absoluteUrl('/privacy');

  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebPage',
        '@id': `${url}#webpage`,
        url,
        name: t.privacy.title,
        description: t.privacy.description,
        inLanguage: 'uk',
        dateModified: t.privacy.lastUpdated.iso,
        isPartOf: { '@id': `${SITE_URL}/#website` },
        breadcrumb: { '@id': `${url}#breadcrumb` },
      },
      {
        '@type': 'BreadcrumbList',
        '@id': `${url}#breadcrumb`,
        itemListElement: [
          {
            '@type': 'ListItem',
            position: 1,
            name: t.privacy.breadcrumbHome,
            item: absoluteUrl('/'),
          },
          { '@type': 'ListItem', position: 2, name: t.privacy.title, item: url },
        ],
      },
    ],
  };
}
