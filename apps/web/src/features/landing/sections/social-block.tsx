import Image from 'next/image';

import { Container } from '@/components/common/container';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { t } from '@/locales';

const CHANNEL_STYLES: Record<string, { icon: string; iconBackground: string }> = {
  instagram: { icon: '/landing/icon-instagram.svg', iconBackground: 'bg-primary' },
  telegram: { icon: '/landing/icon-telegram.svg', iconBackground: 'bg-accent-blue' },
};

export function SocialBlock() {
  const { title, subtitle, open, channels } = t.landing.social;

  return (
    <Container>
      <div className="bg-card flex flex-col gap-6 rounded-3xl p-6 md:p-10">
        <div className="flex flex-col gap-3">
          <h2 className="text-h2 text-foreground">{title}</h2>
          <p className="text-body-lg text-text-secondary">{subtitle}</p>
        </div>
        <ul className="flex flex-col gap-4 md:flex-row">
          {channels.map((channel) => {
            const style = CHANNEL_STYLES[channel.id];
            return (
              <li
                key={channel.id}
                className="bg-background flex flex-1 items-center gap-3 rounded-full p-4"
              >
                {style ? (
                  <span
                    className={cn(
                      'flex size-11 shrink-0 items-center justify-center rounded-full',
                      style.iconBackground,
                    )}
                  >
                    <Image src={style.icon} alt="" width={24} height={24} unoptimized />
                  </span>
                ) : null}
                <div className="flex min-w-0 flex-1 flex-col">
                  <p className="text-h3 text-foreground truncate">{channel.name}</p>
                  <p className="text-body-sm text-text-secondary truncate font-medium">
                    {channel.handle}
                  </p>
                </div>
                <Button asChild size="default">
                  <a href={channel.href} target="_blank" rel="noopener noreferrer">
                    {open}
                  </a>
                </Button>
              </li>
            );
          })}
        </ul>
      </div>
    </Container>
  );
}
