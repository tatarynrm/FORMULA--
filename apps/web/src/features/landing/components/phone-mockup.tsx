'use client';

import { BatteryFull, CircleCheck, Signal, Wifi } from 'lucide-react';
import { type CSSProperties, useEffect, useState } from 'react';

import { CountUp } from '@/components/common/count-up';
import { Typewriter } from '@/components/common/typewriter';
import { useInView } from '@/hooks/use-in-view';
import { useReducedMotion } from '@/hooks/use-reduced-motion';
import { format } from '@/lib/format';
import { cn } from '@/lib/utils';
import { t } from '@/locales';

/** The screen replays this story every CYCLE_MS while the phone is visible. */
const CYCLE_MS = 10_000;
const PROGRESS = 57;

const delay = (ms: number) => ({ '--d': `${ms}ms` }) as CSSProperties;

function StatusBar() {
  return (
    <div className="text-foreground flex items-center justify-between px-1 text-xs font-semibold">
      <span>9:41</span>
      <span className="flex items-center gap-1">
        <Signal className="size-3" />
        <Wifi className="size-3" />
        <BatteryFull className="size-3.5" />
      </span>
    </div>
  );
}

/**
 * Miniature of the student cabinet drawn with the real design tokens. Everything on it animates in
 * sequence (typing, counters, progress bar, a "test passed" toast) like a short product demo.
 */
function PreviewScreen() {
  const { greeting, stats, course } = t.cabinet.home;
  const preview = t.landing.advantages.preview;

  return (
    <div className="bg-card relative flex h-full flex-col gap-3 px-4 pt-3.5">
      <StatusBar />

      <p className="text-body-lg text-foreground mt-3 h-6.5 font-bold">
        <Typewriter text={format(greeting, { name: preview.name })} delay={350} speed={50} caret />
      </p>

      <div className="grid grid-cols-2 gap-2">
        <div
          className="bg-background phone-pop flex flex-col gap-1 rounded-xl p-2.5"
          style={delay(1000)}
        >
          <CountUp
            to={17}
            trigger="mount"
            delay={1000}
            className="text-foreground text-lg leading-none font-extrabold"
          />
          <span className="text-text-secondary text-xs leading-tight">{stats.testsPassed}</span>
        </div>
        <div
          className="bg-surface-raised border-input phone-pop flex flex-col gap-1 rounded-xl border p-2.5"
          style={delay(1140)}
        >
          <CountUp
            to={75}
            suffix="%"
            trigger="mount"
            delay={1140}
            className="text-foreground text-lg leading-none font-extrabold"
          />
          <span className="text-muted-foreground text-xs leading-tight">{stats.averageScore}</span>
        </div>
      </div>

      <div
        className="bg-surface-raised border-input phone-pop flex flex-col gap-2 rounded-xl border p-3"
        style={delay(1800)}
      >
        <p className="text-foreground h-5 text-sm font-bold">
          <Typewriter text={preview.course} delay={2000} speed={40} />
        </p>
        <div className="flex items-center justify-between text-xs">
          <span className="text-muted-foreground font-medium">{course.progressLabel}</span>
          <CountUp
            to={PROGRESS}
            suffix="%"
            trigger="mount"
            delay={2200}
            duration={1200}
            className="text-foreground font-semibold"
          />
        </div>
        <div className="bg-progress-track h-1.5 overflow-hidden rounded-full">
          <div
            className="bg-progress-fill phone-fill h-full rounded-full"
            style={{ ...delay(2200), width: `${PROGRESS}%` }}
          />
        </div>
        <span className="bg-primary text-primary-foreground rounded-full py-1.5 text-center text-xs font-semibold">
          {course.goToStudy}
        </span>
      </div>

      {/* "Test passed" notification sliding in under the dynamic island */}
      <div
        className="phone-toast bg-surface-raised border-input absolute inset-x-3 top-11 z-20 flex items-center gap-2.5 rounded-2xl border p-2.5 shadow-lg"
        style={delay(4300)}
      >
        <CircleCheck className="text-success size-6 shrink-0" />
        <div className="flex min-w-0 flex-col">
          <span className="text-foreground text-xs leading-tight font-bold">
            {preview.toastTitle}
          </span>
          <span className="text-muted-foreground text-xs leading-tight">{preview.toastBody}</span>
        </div>
      </div>
    </div>
  );
}

/**
 * iPhone drawn in CSS: metal frame, black bezel, dynamic island, side buttons and a screen that
 * plays a short demo of the cabinet when it scrolls into view. The parent clips it, so only the
 * top of the phone is visible.
 */
export function PhoneMockup({ alt }: { alt: string }) {
  const reducedMotion = useReducedMotion();
  const [ref, inView] = useInView<HTMLDivElement>({
    threshold: 0.45,
    once: false,
    rootMargin: '0px',
  });
  const [cycle, setCycle] = useState(0);

  // Replay the demo while the phone stays on screen.
  useEffect(() => {
    if (!inView || reducedMotion) return;
    const timer = setInterval(() => setCycle((current) => current + 1), CYCLE_MS);
    return () => clearInterval(timer);
  }, [inView, reducedMotion]);

  const playing = inView || reducedMotion;

  return (
    <div
      ref={ref}
      role="img"
      aria-label={alt}
      className={cn('relative w-67 shrink-0', 'phone-float')}
    >
      {/* Side buttons: silent switch + volume (left), power (right) */}
      <span aria-hidden className="bg-border absolute top-24 -left-0.5 h-6 w-1 rounded-l-sm" />
      <span aria-hidden className="bg-border absolute top-36 -left-0.5 h-11 w-1 rounded-l-sm" />
      <span aria-hidden className="bg-border absolute top-52 -left-0.5 h-11 w-1 rounded-l-sm" />
      <span aria-hidden className="bg-border absolute top-40 -right-0.5 h-16 w-1 rounded-r-sm" />

      {/* Titanium frame */}
      <div className="from-surface-raised to-border h-136.5 rounded-[3.25rem] bg-linear-to-b p-0.75 shadow-2xl">
        {/* Black bezel */}
        <div className="h-full rounded-[3rem] bg-black p-2">
          {/* Screen */}
          <div className="relative h-full overflow-hidden rounded-[2.5rem]">
            <span
              aria-hidden
              className="absolute top-2.5 left-1/2 z-30 h-6 w-22 -translate-x-1/2 rounded-full bg-black"
            />
            <div aria-hidden className="h-full">
              {playing ? <PreviewScreen key={cycle} /> : <div className="bg-card h-full" />}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
