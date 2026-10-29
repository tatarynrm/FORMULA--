'use client';

import { useCallback, useSyncExternalStore } from 'react';

import { secondsUntil } from '../utils/time';

/** The countdown is re-evaluated this often, so it reaches zero within a quarter of a second of the deadline. */
const TICK_MS = 250;

function subscribe(onChange: () => void): () => void {
  const timer = window.setInterval(onChange, TICK_MS);
  return () => window.clearInterval(timer);
}

// The runner is only rendered in the browser (after the attempt was fetched), so there is no server value.
const getServerTick = () => 0;

/**
 * Seconds left until `deadlineAt` (ISO), or `null` when there is no deadline. Time is taken from the
 * device clock corrected by `clockOffsetMs` (server clock minus device clock, see `clockOffsetMs` in
 * `utils/time`), so a device that is minutes off still counts down against the server's deadline.
 * It always measures against the clock, so a throttled background tab catches up.
 */
export function useRemainingSeconds(
  deadlineAt: string | null,
  clockOffsetMs: number,
): number | null {
  // The snapshot is the server time in ticks: the caller re-renders only when a new tick starts.
  const getTick = useCallback(
    () => Math.floor((Date.now() + clockOffsetMs) / TICK_MS),
    [clockOffsetMs],
  );
  const tick = useSyncExternalStore(subscribe, getTick, getServerTick);

  if (deadlineAt === null) return null;
  return secondsUntil(deadlineAt, tick * TICK_MS);
}
