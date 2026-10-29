import Image from 'next/image';

import { Container } from '@/components/common/container';
import { Reveal } from '@/components/common/reveal';
import { ScrollCarousel } from '@/components/common/scroll-carousel';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { SECTION_IDS } from '@/features/site/constants';
import { t } from '@/locales';

export function LearningFormats() {
  const { title, items, detailsCta } = t.landing.learningFormats;

  return (
    <section id={SECTION_IDS.formats} className="scroll-mt-28">
      <Container className="flex flex-col gap-10">
        <Reveal>
          <ScrollCarousel
            title={title}
            columnsClassName="auto-cols-[85%] sm:auto-cols-[calc(50%-0.75rem)] lg:auto-cols-[calc((100%-3rem)/3)]"
          >
            {items.map((item) => (
              <article
                key={item.name}
                className="bg-card lift flex snap-start flex-col gap-4 rounded-2xl p-6"
              >
                <div className="flex flex-col gap-4">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="text-h3 text-foreground">{item.name}</h3>
                    <Badge variant="brand">{item.badge}</Badge>
                  </div>
                  <p className="text-body-md text-text-secondary">{item.description}</p>
                </div>
                <ul className="flex flex-1 flex-col gap-2">
                  {item.features.map((feature) => (
                    <li key={feature} className="flex items-center gap-2">
                      <Image
                        src="/landing/icon-check-1.svg"
                        alt=""
                        width={24}
                        height={24}
                        unoptimized
                      />
                      <span className="text-body-sm text-text-secondary">{feature}</span>
                    </li>
                  ))}
                </ul>
                <Button variant="secondary" className="w-full">
                  {detailsCta}
                </Button>
              </article>
            ))}
          </ScrollCarousel>
        </Reveal>
      </Container>
    </section>
  );
}
