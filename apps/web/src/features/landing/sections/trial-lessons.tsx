import Image from 'next/image';

import { Container } from '@/components/common/container';
import { LinkButton } from '@/components/common/link-button';
import { Reveal } from '@/components/common/reveal';
import { ScrollCarousel } from '@/components/common/scroll-carousel';
import { SECTION_IDS } from '@/features/site/constants';
import { t } from '@/locales';

export function TrialLessons() {
  const { title, cta, play, items } = t.landing.trialLessons;

  return (
    <section id={SECTION_IDS.trial} className="scroll-mt-28">
      <Container className="flex flex-col items-center gap-10">
        <Reveal className="w-full">
          <ScrollCarousel
            title={title}
            className="w-full"
            columnsClassName="auto-cols-[85%] sm:auto-cols-[calc(50%-0.75rem)] lg:auto-cols-[calc((100%-3rem)/3)]"
          >
            {items.map((item, index) => (
              <article key={index} className="flex snap-start flex-col gap-4">
                <div className="bg-surface-soft lift relative flex h-62.5 items-center justify-center rounded-2xl">
                  <button
                    type="button"
                    aria-label={play}
                    className="bg-primary hover:bg-primary-hover flex items-center justify-center rounded-full p-5 transition-colors"
                  >
                    <Image src="/landing/icon-play.svg" alt="" width={24} height={24} unoptimized />
                  </button>
                  <span className="bg-primary text-primary-foreground text-body-sm absolute right-4 bottom-4 rounded-3xl px-4 py-1.5 font-medium">
                    {item.duration}
                  </span>
                </div>
                <div className="flex flex-col gap-2">
                  <h3 className="text-h3 text-foreground">{item.title}</h3>
                  <p className="text-body-md text-text-secondary">{item.description}</p>
                </div>
              </article>
            ))}
          </ScrollCarousel>
        </Reveal>
        <Reveal delay={150}>
          <LinkButton href="/register">{cta}</LinkButton>
        </Reveal>
      </Container>
    </section>
  );
}
