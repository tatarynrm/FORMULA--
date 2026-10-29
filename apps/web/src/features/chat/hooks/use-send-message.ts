'use client';

import type { AuthUser, SendChatMessageInput } from '@formula/shared';
import { useQueryClient } from '@tanstack/react-query';
import { useCallback, useEffect, useRef } from 'react';

import { t } from '@/locales';

import type { ThreadData, ThreadMessage, ThreadScope } from '../types';
import {
  addLocalMessage,
  appendMessage,
  removeLocalMessage,
  setLocalState,
} from '../utils/thread-cache';

let localCounter = 0;

/**
 * Sends messages optimistically: the row appears at once in the `sending` state, is replaced by
 * the server copy when the api answers, or turns `failed` with a retry. The live stream may push
 * the server copy first; `appendMessage` handles both orders.
 */
export function useSendMessage(scope: ThreadScope, me: AuthUser | undefined) {
  const queryClient = useQueryClient();
  const meRef = useRef(me);
  useEffect(() => {
    meRef.current = me;
  });

  const patch = useCallback(
    (update: (data: ThreadData) => ThreadData) => {
      queryClient.setQueryData<ThreadData>(scope.queryKey, (current) =>
        current ? update(current) : current,
      );
    },
    [queryClient, scope.queryKey],
  );

  const deliver = useCallback(
    async (localId: string, input: SendChatMessageInput) => {
      try {
        const message = await scope.endpoints.send(input);
        patch((data) => appendMessage(data, message, scope.side, localId));
      } catch {
        patch((data) => setLocalState(data, localId, 'failed'));
      }
    },
    [patch, scope],
  );

  const send = useCallback(
    (input: SendChatMessageInput) => {
      const current = queryClient.getQueryData<ThreadData>(scope.queryKey);
      if (!current) return;

      localCounter += 1;
      const localId = `local-${Date.now()}-${localCounter}`;
      const user = meRef.current;
      const message: ThreadMessage = {
        id: localId,
        localId,
        state: 'sending',
        conversationId: current.conversation.id,
        senderId: user?.id ?? null,
        senderRole: scope.side,
        senderName: user ? `${user.name} ${user.surname}`.trim() : t.chat.thread.you,
        body: input.body ?? '',
        imageFileId: input.imageFileId ?? null,
        createdAt: new Date().toISOString(),
        readAt: null,
      };
      patch((data) => addLocalMessage(data, message));
      void deliver(localId, input);
    },
    [deliver, patch, queryClient, scope],
  );

  const retry = useCallback(
    (localId: string) => {
      const current = queryClient.getQueryData<ThreadData>(scope.queryKey);
      const message = current?.messages.find((candidate) => candidate.localId === localId);
      if (!message) return;
      patch((data) => setLocalState(data, localId, 'sending'));
      void deliver(localId, {
        body: message.body || undefined,
        imageFileId: message.imageFileId,
      });
    },
    [deliver, patch, queryClient, scope.queryKey],
  );

  const discard = useCallback(
    (localId: string) => patch((data) => removeLocalMessage(data, localId)),
    [patch],
  );

  return { send, retry, discard };
}
