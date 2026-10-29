'use client';

import { useEffect, useState } from 'react';

/** "5 хв тому" must keep up even when the data did not change; this is how often the clock is re-read. */
const CLOCK_MS = 30_000;

/** The current time, refreshed every half minute, so relative times on a page stay honest. */
export function useNow(): number {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), CLOCK_MS);
    return () => window.clearInterval(id);
  }, []);

  return now;
}
