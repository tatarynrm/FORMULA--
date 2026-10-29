import type { MessengerBot, MessengerBotLink, MessengerBotStatus } from '@formula/shared';

import { apiFetch } from '@/lib/api-client';

const base = (provider: MessengerBot) => `/messengers/${encodeURIComponent(provider)}`;

/** Connecting a messenger bot (Telegram first) to the signed-in account. */
export const messengersApi = {
  status: (provider: MessengerBot) => apiFetch<MessengerBotStatus>(base(provider)),

  createLink: (provider: MessengerBot) =>
    apiFetch<MessengerBotLink>(`${base(provider)}/link`, { method: 'POST' }),

  unlink: (provider: MessengerBot) =>
    apiFetch<MessengerBotStatus>(`${base(provider)}/link`, { method: 'DELETE' }),

  setNotifications: (provider: MessengerBot, notificationsEnabled: boolean) =>
    apiFetch<MessengerBotStatus>(`${base(provider)}/settings`, {
      method: 'PATCH',
      body: { notificationsEnabled },
    }),
};
