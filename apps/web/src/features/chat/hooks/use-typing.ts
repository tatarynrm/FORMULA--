'use client';

import { CHAT } from '@formula/shared';
import { useCallback, useEffect, useRef, useState } from 'react';

import { useRealtimeEvent } from '@/features/realtime/hooks/use-realtime-event';

import type { ThreadScope } from '../types';

/**
 * Both directions of "is typing": `notifyTyping` tells the api at most every
 * `TYPING_THROTTLE_MS`; `typingName` is who is typing on the other side, cleared after
 * `TYPING_TTL_MS` of silence or as soon as their message arrives.
 */
export function useTyping(scope: ThreadScope, conversationId: string | undefined) {
  const [typingName, setTypingName] = useState<string | null>(null);
  const lastSentAt = useRef(0);
  const clearTimer = useRef<number | null>(null);

  const clear = useCallback(() => {
    if (clearTimer.current !== null) window.clearTimeout(clearTimer.current);
    clearTimer.current = null;
    setTypingName(null);
  }, []);

  useRealtimeEvent('chat.typing', (event) => {
    if (event.conversationId !== conversationId || event.role === scope.side) return;
    setTypingName(event.name);
    if (clearTimer.current !== null) window.clearTimeout(clearTimer.current);
    clearTimer.current = window.setTimeout(() => setTypingName(null), CHAT.TYPING_TTL_MS);
  });

  useRealtimeEvent('chat.message', (event) => {
    if (event.message.conversationId === conversationId && event.message.senderRole !== scope.side)
      clear();
  });

  // Another conversation (or none): whoever was typing is not relevant any more.
  useEffect(() => clear, [conversationId, clear]);

  const notifyTyping = useCallback(() => {
    const now = Date.now();
    if (now - lastSentAt.current < CHAT.TYPING_THROTTLE_MS) return;
    lastSentAt.current = now;
    scope.endpoints.typing().catch(() => {
      // A lost typing hint is not worth an error.
    });
  }, [scope]);

  return { typingName, notifyTyping };
}
