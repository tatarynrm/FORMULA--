import Image from 'next/image';

import { Container } from '@/components/common/container';
import { LinkButton } from '@/components/common/link-button';
import { Reveal } from '@/components/common/reveal';
import { t } from '@/locales';

import { SECTION_IDS } from '@/features/site/constants';

import { PhoneMockup } from '../components/phone-mockup';

type Advantage = (typeof t.landing.advantages.items)[number];

function AdvantageCard({ item }: { item: Advantage }) {
  return (
    <article className="bg-card lift flex flex-1 flex-col gap-4 rounded-2xl p-6">
      <div className="bg-primary/10 flex size-11 items-center justify-center rounded-3xl">
        <Image src={`/landing/icon-${item.icon}.svg`} alt="" width={24} height={24} unoptimized />
      </div>
      <div className="flex flex-col gap-3">
        <h3 className="text-h3 text-foreground">{item.title}</h3>
        <p className="text-body-md text-text-secondary">{item.description}</p>
      </div>
    </article>
  );
}

export function Advantages() {
  const { title, cta, previewAlt, items } = t.landing.advantages;
  const [first, second, third, fourth, fifth] = items;

  return (
    <section id={SECTION_IDS.advantages} className="scroll-mt-28">
      <Container className="flex flex-col gap-10">
        <Reveal className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between md:gap-7">
          <h2 className="text-h2 text-foreground max-w-155">{title}</h2>
          <LinkButton href="/register" className="self-start">
            {cta}
          </LinkButton>
        </Reveal>

        <Reveal group className="grid gap-6 md:grid-cols-3">
          <div className="flex flex-col gap-6">
            <AdvantageCard item={first} />
            <AdvantageCard item={second} />
          </div>
          <div className="flex flex-col gap-6">
            <div className="bg-primary flex h-80 justify-center overflow-hidden rounded-2xl pt-6">
              <PhoneMockup alt={previewAlt} />
            </div>
            <AdvantageCard item={third} />
          </div>
          <div className="flex flex-col gap-6">
            <AdvantageCard item={fourth} />
            <AdvantageCard item={fifth} />
          </div>
        </Reveal>
      </Container>
    </section>
  );
}
