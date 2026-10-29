import { CountUp } from '@/components/common/count-up';
import { ImageSlot } from '@/components/common/image-slot';
import { Reveal } from '@/components/common/reveal';
import { SECTION_IDS } from '@/features/site/constants';
import { parseStat } from '@/lib/format';
import { t } from '@/locales';

export function AboutAuthor() {
  const { title, paragraphs, imageAlt } = t.landing.aboutAuthor;

  return (
    <section id={SECTION_IDS.about} className="scroll-mt-28">
      <Reveal
        group
        className="mx-auto grid w-full max-w-318 items-center gap-8 px-4 md:grid-cols-2 md:gap-16 md:px-6"
      >
        <ImageSlot label={imageAlt} className="aspect-square md:aspect-10/9" />
        <div className="flex flex-col gap-6">
          <h2 className="text-h2 text-foreground">{title}</h2>
          <div className="text-body-md text-text-secondary flex flex-col">
            {paragraphs.map((paragraph, index) => (
              <p key={index}>{paragraph}</p>
            ))}
          </div>
          <ul className="flex items-center justify-between pt-6">
            {t.landing.keyNumbers.items.map((item, index) => {
              const { to, suffix } = parseStat(item.value);
              return (
                <li key={index} className="flex w-44 flex-col gap-2">
                  <p className="text-h2 text-primary">
                    <CountUp to={to} suffix={suffix} delay={index * 150} />
                  </p>
                  <p className="text-body-sm text-text-secondary">{item.label}</p>
                </li>
              );
            })}
          </ul>
        </div>
      </Reveal>
    </section>
  );
}
