import { Container } from '@/components/common/container';
import { Reveal } from '@/components/common/reveal';
import { SECTION_IDS } from '@/features/site/constants';
import { LeaveTestimonialButton } from '@/features/testimonials/components/leave-testimonial-button';
import { TestimonialsShowcase } from '@/features/testimonials/components/testimonials-showcase';
import { t } from '@/locales';

/** Published testimonials and the way to leave one (guests and signed-in students alike). */
export function ResultsReviews() {
  const { title, leaveReviewTitle, leaveReviewHint, leaveReviewCta } = t.landing.resultsReviews;

  return (
    <section id={SECTION_IDS.reviews} className="scroll-mt-28">
      <Container className="flex flex-col gap-6">
        <Reveal>
          <TestimonialsShowcase title={title} />
        </Reveal>

        <Reveal className="bg-card flex flex-col gap-4 rounded-[22px] p-6 md:flex-row md:items-start">
          <div className="flex flex-1 flex-col gap-1">
            <p className="text-h3 text-foreground">{leaveReviewTitle}</p>
            <p className="text-body-md text-text-secondary">{leaveReviewHint}</p>
          </div>
          <LeaveTestimonialButton label={leaveReviewCta} />
        </Reveal>
      </Container>
    </section>
  );
}
