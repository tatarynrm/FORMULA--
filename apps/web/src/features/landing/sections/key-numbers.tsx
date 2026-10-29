import { Container } from '@/components/common/container';
import { CountUp } from '@/components/common/count-up';
import { Reveal } from '@/components/common/reveal';
import { parseStat } from '@/lib/format';
import { t } from '@/locales';

export function KeyNumbers() {
  return (
    <Container>
      <Reveal
        as="ul"
        group
        className="bg-card flex flex-col items-center justify-between gap-6 rounded-3xl px-6 py-6 sm:flex-row md:px-16"
      >
        {t.landing.keyNumbers.items.map((item, index) => {
          const { to, suffix } = parseStat(item.value);
          return (
            <li key={index} className="flex w-44 flex-col items-center gap-2 text-center">
              <p className="text-stat text-primary">
                <CountUp to={to} suffix={suffix} delay={index * 150} />
              </p>
              <p className="text-body-lg text-text-secondary">{item.label}</p>
            </li>
          );
        })}
      </Reveal>
    </Container>
  );
}
