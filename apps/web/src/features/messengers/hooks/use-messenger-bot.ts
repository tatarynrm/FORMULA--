'use client';

import type { MessengerBot, MessengerBotStatus } from '@formula/shared';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { useRealtimeEvent } from '@/features/realtime/hooks/use-realtime-event';

import { messengersApi } from '../api/messengers-api';

export const messengerKeys = {
  bot: (provider: MessengerBot) => ['messengers', provider] as const,
};

/** A fallback while the live stream is down: how often to ask while a connection is being made. */
const WAITING_POLL_MS = 4000;

/**
 * How a messenger bot is connected to this account. The api pushes `messenger.updated` when the
 * person finishes in the messenger (or changes something in another tab), so the card follows
 * without a reload; `waiting` adds a slow poll for the minutes between "open the bot" and "done".
 */
export function useMessengerBot(provider: MessengerBot, waiting = false) {
  const queryClient = useQueryClient();
  useRealtimeEvent('messenger.updated', (event) => {
    if (event.provider === provider) {
      void queryClient.invalidateQueries({ queryKey: messengerKeys.bot(provider) });
    }
  });

  return useQuery({
    queryKey: messengerKeys.bot(provider),
    queryFn: () => messengersApi.status(provider),
    staleTime: 30_000,
    refetchInterval: waiting ? WAITING_POLL_MS : false,
  });
}

function useSetStatus(provider: MessengerBot) {
  const queryClient = useQueryClient();
  return (status: MessengerBotStatus) =>
    queryClient.setQueryData(messengerKeys.bot(provider), status);
}

export function useCreateBotLink(provider: MessengerBot) {
  return useMutation({ mutationFn: () => messengersApi.createLink(provider) });
}

export function useUnlinkBot(provider: MessengerBot) {
  const setStatus = useSetStatus(provider);
  return useMutation({
    mutationFn: () => messengersApi.unlink(provider),
    onSuccess: setStatus,
  });
}

export function useBotNotifications(provider: MessengerBot) {
  const setStatus = useSetStatus(provider);
  return useMutation({
    mutationFn: (enabled: boolean) => messengersApi.setNotifications(provider, enabled),
    onSuccess: setStatus,
  });
}
