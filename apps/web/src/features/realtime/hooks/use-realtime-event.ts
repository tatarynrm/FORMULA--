'use client';

import type { RealtimeEvent, RealtimeEventType } from '@formula/shared';
import { useContext, useEffect, useRef } from 'react';

import { RealtimeContext } from '../realtime-provider';

type EventOf<T extends RealtimeEventType> = Extract<RealtimeEvent, { type: T }>;

/**
 * Runs `handler` for every pushed event of the given type while the component is mounted.
 * The latest handler is always used, so it may close over state freely. Outside a
 * `RealtimeProvider` (public pages) it does nothing.
 */
export function useRealtimeEvent<T extends RealtimeEventType>(
  type: T,
  handler: (event: EventOf<T>) => void,
): void {
  const context = useContext(RealtimeContext);
  const latest = useRef(handler);

  useEffect(() => {
    latest.current = handler;
  });

  useEffect(() => {
    if (!context) return;
    return context.subscribe((event) => {
      if (event.type === type) latest.current(event as EventOf<T>);
    });
  }, [context, type]);
}

/** Whether the live stream is open (for a small "offline" hint in the chat). */
export function useRealtimeConnected(): boolean {
  return useContext(RealtimeContext)?.connected ?? false;
}
