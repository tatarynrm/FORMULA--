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

// The home page uses the site-wide title and description from the root layout; only the
// canonical URL and the page-specific title are set here.
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
