import type { Metadata } from 'next';

import { Container } from '@/components/common/container';
import { JsonLd } from '@/components/common/json-ld';
import { Footer } from '@/features/landing/sections/footer';
import { PolicyContacts } from '@/features/legal/components/policy-contacts';
import { PolicyLayout } from '@/features/legal/components/policy-layout';
import { PolicySection } from '@/features/legal/components/policy-section';
import { getPrivacyStructuredData } from '@/features/legal/structured-data';
import { SiteHeader } from '@/features/site/components/site-header';
import { createPageMetadata } from '@/lib/seo';
import { t } from '@/locales';

// The preview picture is app/(public)/privacy/opengraph-image.png (picked up by Next.js).
export const metadata: Metadata = createPageMetadata({
  title: t.privacy.title,
  description: t.privacy.description,
  path: '/privacy',
});

export default function PrivacyPage() {
  const { sections, contacts, lastUpdated, toc } = t.privacy;

  return (
    <>
      <JsonLd data={getPrivacyStructuredData()} />
      <SiteHeader />
      <main className="pt-10 pb-20 md:pb-30">
        <Container>
          <PolicyLayout
            eyebrow={t.privacy.eyebrow}
            title={t.privacy.title}
            updatedLabel={lastUpdated.label}
            updatedIso={lastUpdated.iso}
            updatedDisplay={lastUpdated.display}
            intro={t.privacy.intro}
            summary={t.privacy.summary}
            breadcrumb={{ label: t.privacy.breadcrumbLabel, homeLabel: t.privacy.breadcrumbHome }}
            toc={{
              title: toc.title,
              navLabel: toc.navLabel,
              items: [
                ...sections.map(({ id, title }) => ({ id, title })),
                { id: contacts.id, title: contacts.title },
              ],
            }}
          >
            {sections.map((section, index) => (
              <PolicySection key={section.id} section={section} number={index + 1} />
            ))}
            <PolicyContacts {...contacts} />
          </PolicyLayout>
        </Container>
      </main>
      <div className="pb-6">
        <Footer />
      </div>
    </>
  );
}
