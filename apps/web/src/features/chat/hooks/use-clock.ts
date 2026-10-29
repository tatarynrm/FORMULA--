'use client';

import { useEffect, useState } from 'react';

/** "5 хв", "Сьогодні" must keep up even when nothing arrives; this is how often the clock is re-read. */
const CLOCK_MS = 30_000;

/** The current time, refreshed every half minute, so relative times on screen stay honest. */
export function useClock(): number {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), CLOCK_MS);
    return () => window.clearInterval(id);
  }, []);

  return now;
}
