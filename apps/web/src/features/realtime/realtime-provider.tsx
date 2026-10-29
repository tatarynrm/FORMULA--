'use client';

import { REALTIME, type RealtimeEvent } from '@formula/shared';
import { createContext, type ReactNode, useEffect, useMemo, useRef, useState } from 'react';

import { refreshSession } from '@/lib/api-client';
import { env } from '@/lib/env';

export type RealtimeHandler = (event: RealtimeEvent) => void;

export interface RealtimeContextValue {
  /** Starts receiving every event; returns the function that stops it. */
  subscribe: (handler: RealtimeHandler) => () => void;
  /** Whether the stream is open right now (a short gap during reconnects is normal). */
  connected: boolean;
}

export const RealtimeContext = createContext<RealtimeContextValue | null>(null);

/**
 * One Server-Sent Events stream per tab (`GET /events`, cookie session). Feature hooks subscribe
 * through `useRealtimeEvent`. The browser would retry by itself, but an expired access cookie needs
 * `/auth/refresh` first, so reconnects are handled here with a growing delay.
 */
export function RealtimeProvider({ children }: { children: ReactNode }) {
  const handlers = useRef(new Set<RealtimeHandler>());
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    const url = `${env.NEXT_PUBLIC_API_URL}${REALTIME.PATH}`;
    let source: EventSource | null = null;
    let timer: ReturnType<typeof setTimeout> | null = null;
    let attempt = 0;
    let stopped = false;

    function open() {
      if (stopped) return;
      source = new EventSource(url, { withCredentials: true });
      source.onopen = () => {
        attempt = 0;
        setConnected(true);
      };
      source.onmessage = (message: MessageEvent<string>) => {
        let event: RealtimeEvent;
        try {
          event = JSON.parse(message.data) as RealtimeEvent;
        } catch {
          return;
        }
        for (const handler of handlers.current) handler(event);
      };
      source.onerror = () => {
        source?.close();
        source = null;
        setConnected(false);
        if (stopped) return;
        attempt += 1;
        const delay = Math.min(REALTIME.RETRY_MS * 2 ** Math.min(attempt - 1, 4), 30_000);
        timer = setTimeout(() => {
          void refreshSession().finally(open);
        }, delay);
      };
    }

    open();
    return () => {
      stopped = true;
      if (timer) clearTimeout(timer);
      source?.close();
    };
  }, []);

  const value = useMemo<RealtimeContextValue>(
    () => ({
      subscribe: (handler) => {
        handlers.current.add(handler);
        return () => {
          handlers.current.delete(handler);
        };
      },
      connected,
    }),
    [connected],
  );

  return <RealtimeContext.Provider value={value}>{children}</RealtimeContext.Provider>;
}
