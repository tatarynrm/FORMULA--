import { Container } from '@/components/common/container';
import { ImageSlot } from '@/components/common/image-slot';
import { LinkButton } from '@/components/common/link-button';
import { Badge } from '@/components/ui/badge';
import { t } from '@/locales';

export function Hero() {
  const { badges, title, subtitle, primaryCta, secondaryCta, imageAlt } = t.landing.hero;

  return (
    <Container className="hero-stagger grid items-center gap-8 md:min-h-150 md:grid-cols-2 md:gap-16">
      <div className="hero-stagger flex flex-col items-start gap-7">
        <ul className="flex flex-wrap gap-2">
          {badges.map((badge) => (
            <li key={badge}>
              <Badge variant="brand">{badge}</Badge>
            </li>
          ))}
        </ul>
        <div className="flex flex-col gap-4">
          <h1 className="text-h1 text-foreground">{title}</h1>
          <p className="text-body-xl text-text-secondary">{subtitle}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <LinkButton href="/register">{primaryCta}</LinkButton>
          <LinkButton href="/register" variant="secondary">
            {secondaryCta}
          </LinkButton>
        </div>
      </div>
      <ImageSlot label={imageAlt} />
    </Container>
  );
}
