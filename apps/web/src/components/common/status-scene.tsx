import type { CSSProperties, ReactNode } from 'react';

import { Logo } from '@/components/common/logo';

interface StatusSceneProps {
  eyebrow: string;
  title: string;
  description: string;
  illustration: ReactNode;
  actions: ReactNode;
  /** Small print under the buttons (for example the error code). */
  note?: ReactNode;
  /** The root error page renders outside the app shell, where the logo link is not available. */
  showLogo?: boolean;
}

/** Soft dots drifting in the background: position, size, colour and start delay. */
const PARTICLES = [
  { left: '8%', top: '16%', size: 'size-3', tone: 'bg-primary/25', delay: '0ms' },
  { left: '88%', top: '22%', size: 'size-4', tone: 'bg-accent-blue/20', delay: '600ms' },
  { left: '18%', top: '72%', size: 'size-5', tone: 'bg-accent-blue/15', delay: '1200ms' },
  { left: '80%', top: '70%', size: 'size-3', tone: 'bg-primary/20', delay: '300ms' },
  { left: '50%', top: '10%', size: 'size-2', tone: 'bg-primary/30', delay: '900ms' },
  { left: '66%', top: '86%', size: 'size-2', tone: 'bg-accent-blue/25', delay: '1500ms' },
  { left: '30%', top: '30%', size: 'size-2', tone: 'bg-accent-blue/20', delay: '1800ms' },
] as const;

/** Full-page layout shared by the 404 page and the error pages. */
export function StatusScene({
  eyebrow,
  title,
  description,
  illustration,
  actions,
  note,
  showLogo = true,
}: StatusSceneProps) {
  return (
    <main className="relative isolate flex min-h-dvh flex-col items-center justify-center gap-8 overflow-hidden px-4 py-16 text-center">
      {PARTICLES.map(({ left, top, size, tone, delay }) => (
        <span
          key={`${left}${top}`}
          aria-hidden
          className={`scene-float absolute -z-10 rounded-full ${size} ${tone}`}
          style={{ left, top, '--d': delay } as CSSProperties}
        />
      ))}

      {showLogo ? (
        <div className="absolute top-6 left-1/2 -translate-x-1/2">
          <Logo />
        </div>
      ) : null}

      {illustration}

      <div className="hero-stagger flex max-w-md flex-col items-center gap-4">
        <p className="bg-card text-primary text-body-sm rounded-full px-4 py-1 font-bold">
          {eyebrow}
        </p>
        <h1 className="text-h2 text-foreground">{title}</h1>
        <p className="text-body-md text-muted-foreground">{description}</p>
        <div className="mt-2 flex flex-wrap items-center justify-center gap-3">{actions}</div>
        {note}
      </div>
    </main>
  );
}
