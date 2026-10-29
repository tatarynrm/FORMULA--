'use client';

import { useEffect, useState } from 'react';

import { useReducedMotion } from '@/hooks/use-reduced-motion';

interface TypewriterProps {
  text: string;
  /** Delay before the first character, in ms. */
  delay?: number;
  /** Time per character, in ms. */
  speed?: number;
  /** Show a blinking caret while typing. */
  caret?: boolean;
  className?: string;
}

/** Types `text` out character by character. Screen readers get the full text immediately. */
export function Typewriter({
  text,
  delay = 0,
  speed = 45,
  caret = false,
  className,
}: TypewriterProps) {
  const reducedMotion = useReducedMotion();
  const [typed, setTyped] = useState(0);

  useEffect(() => {
    if (reducedMotion) return;

    let interval: ReturnType<typeof setInterval> | undefined;

    const start = setTimeout(() => {
      interval = setInterval(() => {
        setTyped((count) => {
          if (count >= text.length) {
            clearInterval(interval);
            return count;
          }
          return count + 1;
        });
      }, speed);
    }, delay);

    return () => {
      clearTimeout(start);
      clearInterval(interval);
    };
  }, [text, delay, speed, reducedMotion]);

  const visibleCount = reducedMotion ? text.length : typed;

  return (
    <span className={className}>
      <span className="sr-only">{text}</span>
      <span aria-hidden>
        {text.slice(0, visibleCount)}
        {caret && visibleCount < text.length ? <span className="caret" /> : null}
      </span>
    </span>
  );
}
