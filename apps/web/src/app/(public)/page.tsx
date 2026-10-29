import type { Metadata } from 'next';

import { JsonLd } from '@/components/common/json-ld';
import { SmoothScroll } from '@/components/common/smooth-scroll';
import { getLandingStructuredData } from '@/features/landing/structured-data';
import { SiteHeader } from '@/features/site/components/site-header';
import {
  AboutAuthor,
  Advantages,
  Faq,
  Footer,
  Hero,
  KeyNumbers,
  LearningFormats,
  ResultsReviews,
  SocialBlock,
  TrialLessons,
} from '@/features/landing/sections';
import { t } from '@/locales';

// The home page inherits description, Open Graph and Twitter card (with the preview picture
// app/opengraph-image.png) from the root layout. A page that defines its own `openGraph` would
// lose that picture, because Next.js replaces the object as a whole, so only title and
// canonical are set here.
export const metadata: Metadata = {
  title: { absolute: t.meta.title },
  alternates: { canonical: '/' },
};

export default function LandingPage() {
  return (
    <>
      <JsonLd data={getLandingStructuredData()} />
      <SmoothScroll />
      <SiteHeader />
      <main className="flex flex-col gap-20 pt-10 pb-6 md:gap-30">
        <div className="flex flex-col gap-10">
          <Hero />
          <KeyNumbers />
        </div>
        <Advantages />
        <LearningFormats />
        <AboutAuthor />
        <TrialLessons />
        <ResultsReviews />
        <div className="flex flex-col gap-20">
          <Faq />
          <SocialBlock />
        </div>
        <Footer />
      </main>
    </>
  );
}
