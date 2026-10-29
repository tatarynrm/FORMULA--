import { SITE_NAME, SITE_URL, absoluteUrl } from '@/lib/site';
import { t } from '@/locales';

const ORGANIZATION_ID = `${SITE_URL}/#organization`;
const WEBSITE_ID = `${SITE_URL}/#website`;

/**
 * schema.org graph for the landing page: the school, the website and the FAQ block
 * (eligible for Google's FAQ rich result). The FAQ text comes from the same dictionary as the page.
 */
export function getLandingStructuredData(): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'EducationalOrganization',
        '@id': ORGANIZATION_ID,
        name: SITE_NAME,
        description: t.meta.organization,
        url: SITE_URL,
        logo: {
          '@type': 'ImageObject',
          url: absoluteUrl('/icon-512.png'),
          width: 512,
          height: 512,
        },
        // TODO: add `sameAs` with the real Instagram / Telegram / YouTube URLs once they exist.
      },
      {
        '@type': 'WebSite',
        '@id': WEBSITE_ID,
        url: SITE_URL,
        name: SITE_NAME,
        description: t.meta.description,
        inLanguage: 'uk',
        publisher: { '@id': ORGANIZATION_ID },
      },
      {
        '@type': 'FAQPage',
        mainEntity: t.landing.faq.items.map((item) => ({
          '@type': 'Question',
          name: item.question,
          acceptedAnswer: { '@type': 'Answer', text: item.answer },
        })),
      },
    ],
  };
}
