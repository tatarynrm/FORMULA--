'use client';

import { useEffect, useState } from 'react';

import { useInView } from '@/hooks/use-in-view';
import { useReducedMotion } from '@/hooks/use-reduced-motion';

interface CountUpProps {
  to: number;
  suffix?: string;
  /** Duration of the count in ms. */
  duration?: number;
  /** Delay before counting starts, in ms. */
  delay?: number;
  /** `view` waits until the number scrolls into view, `mount` starts right away. */
  trigger?: 'view' | 'mount';
  className?: string;
}

const easeOutCubic = (progress: number) => 1 - (1 - progress) ** 3;

/** Number that counts up from 0. Screen readers get the final value immediately. */
export function CountUp({
  to,
  suffix = '',
  duration = 1400,
  delay = 0,
  trigger = 'view',
  className,
}: CountUpProps) {
  const reducedMotion = useReducedMotion();
  const [ref, inView] = useInView<HTMLSpanElement>();
  const [value, setValue] = useState(0);
  const active = trigger === 'mount' || inView;

  useEffect(() => {
    if (!active || reducedMotion) return;

    let frame = 0;
    const startedAt = performance.now() + delay;

    const tick = (now: number) => {
      const progress = Math.min(Math.max((now - startedAt) / duration, 0), 1);
      setValue(Math.round(to * easeOutCubic(progress)));
      if (progress < 1) frame = requestAnimationFrame(tick);
    };

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [active, reducedMotion, to, duration, delay]);

  return (
    <span ref={ref} className={className}>
      <span className="sr-only">
        {to}
        {suffix}
      </span>
      <span aria-hidden className="tabular-nums">
        {reducedMotion ? to : value}
        {suffix}
      </span>
    </span>
  );
}
