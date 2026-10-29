import type {
  NotificationBroadcast,
  NotificationItem,
  NotificationSummary,
  SendBroadcastInput,
} from '@formula/shared';

import { apiFetch, apiFetchPage } from '@/lib/api-client';

/** Notifications of the signed-in user, plus the admin news broadcasts (section `news`). */
export const notificationsApi = {
  /** Newest first; `unreadOnly` asks the api for the unread ones only. */
  list: ({ page, limit, unreadOnly }: { page: number; limit: number; unreadOnly: boolean }) =>
    apiFetchPage<NotificationItem>(
      `/v1/notifications?page=${page}&limit=${limit}${unreadOnly ? '&unread=true' : ''}`,
    ),

  summary: () => apiFetch<NotificationSummary>('/v1/notifications/summary'),

  markRead: (id: string) =>
    apiFetch<NotificationItem>(`/v1/notifications/${encodeURIComponent(id)}/read`, {
      method: 'POST',
    }),

  markAllRead: () => apiFetch<{ unread: number }>('/v1/notifications/read-all', { method: 'POST' }),

  sendNews: (input: SendBroadcastInput) =>
    apiFetch<NotificationBroadcast>('/v1/admin/news', { method: 'POST', body: input }),

  newsHistory: (page: number, limit: number) =>
    apiFetchPage<NotificationBroadcast>(`/v1/admin/news?page=${page}&limit=${limit}`),
};
