'use client';

import { NOTIFICATIONS, type NotificationSummary } from '@formula/shared';
import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useMemo, useRef } from 'react';

import {
  useRealtimeConnected,
  useRealtimeEvent,
} from '@/features/realtime/hooks/use-realtime-event';

import { notificationsApi } from '../api/notifications-api';
import {
  findCachedNotification,
  invalidateNotifications,
  notificationKeys,
  patchNotifications,
  retryOnServerError,
  setUnreadCount,
  updateLists,
} from './query-keys';

/** The live stream normally keeps the numbers fresh; this is the fallback when it is down. */
const SUMMARY_REFRESH_MS = 60_000;

/** Unread count and, for admins, the queues they may handle. */
export function useNotificationSummary() {
  return useQuery({
    queryKey: notificationKeys.summary,
    queryFn: notificationsApi.summary,
    refetchInterval: SUMMARY_REFRESH_MS,
    staleTime: 30_000,
    retry: retryOnServerError,
  });
}

interface NotificationsListOptions {
  /** Only the unread ones (the api filters; this list has its own cache). */
  unreadOnly?: boolean;
  /** At most this many items (the bell shows the head of the list). */
  limit?: number;
  enabled?: boolean;
}

/** The feed, newest first, page by page. The bell and the feed page share the cache per filter. */
export function useNotificationsList({
  unreadOnly = false,
  limit,
  enabled = true,
}: NotificationsListOptions = {}) {
  const query = useInfiniteQuery({
    queryKey: notificationKeys.list(unreadOnly),
    queryFn: ({ pageParam }) =>
      notificationsApi.list({ page: pageParam, limit: NOTIFICATIONS.PAGE_SIZE, unreadOnly }),
    initialPageParam: 1,
    getNextPageParam: (last) =>
      last.meta.page < last.meta.totalPages ? last.meta.page + 1 : undefined,
    enabled,
    staleTime: 30_000,
    retry: retryOnServerError,
  });

  const items = useMemo(() => {
    const all = query.data?.pages.flatMap((page) => page.items) ?? [];
    return limit === undefined ? all : all.slice(0, limit);
  }, [query.data, limit]);

  return {
    items,
    isPending: query.isPending,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
    hasNextPage: query.hasNextPage,
    isFetchingNextPage: query.isFetchingNextPage,
    fetchNextPage: query.fetchNextPage,
  };
}

/** Marks one notification read. The row and the badge update at once; a failure reloads both. */
export function useMarkRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => notificationsApi.markRead(id),
    onMutate: (id) => {
      const current = findCachedNotification(queryClient, id);
      if (!current || current.readAt !== null) return;
      const readAt = new Date().toISOString();
      patchNotifications(queryClient, (item) => (item.id === id ? { ...item, readAt } : item));
      setUnreadCount(queryClient, (unread) => unread - 1);
    },
    onSuccess: (item) =>
      patchNotifications(queryClient, (cached) => (cached.id === item.id ? item : cached)),
    onError: () => invalidateNotifications(queryClient),
  });
}

export function useMarkAllRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: notificationsApi.markAllRead,
    onSuccess: ({ unread }) => {
      const readAt = new Date().toISOString();
      patchNotifications(queryClient, (item) =>
        item.readAt === null ? { ...item, readAt } : item,
      );
      setUnreadCount(queryClient, unread);
    },
  });
}

/**
 * Feeds the live stream into the caches: a new notification lands at the top of every loaded list
 * and sets the badge, a read in another tab updates the badge, a refresh reloads everything.
 * Mounted by the bell; every handler is idempotent, because the desktop and the mobile bell are
 * both in the DOM.
 */
export function useNotificationsRealtime(): void {
  const queryClient = useQueryClient();

  useRealtimeEvent('notification', ({ notification, unread }) => {
    updateLists(queryClient, (data) => {
      if (data.pages.length === 0) return data;
      // The api may refresh an existing entry instead of adding one (one entry per chat), so a
      // known id moves to the top rather than appearing twice.
      const known = data.pages.some((page) =>
        page.items.some((item) => item.id === notification.id),
      );
      const pages = data.pages.map((page) => ({
        ...page,
        items: page.items.filter((item) => item.id !== notification.id),
      }));
      const [first, ...rest] = pages;
      return {
        ...data,
        pages: [
          {
            items: [notification, ...first.items],
            meta: { ...first.meta, total: known ? first.meta.total : first.meta.total + 1 },
          },
          ...rest,
        ],
      };
    });
    queryClient.setQueryData<NotificationSummary>(notificationKeys.summary, (old) =>
      old ? { ...old, unread } : old,
    );
  });

  useRealtimeEvent('notifications.read', ({ unread }) => {
    setUnreadCount(queryClient, unread);
    // Something was read elsewhere (another tab, or the chat page); the rows must follow.
    void queryClient.invalidateQueries({ queryKey: notificationKeys.lists });
  });

  useRealtimeEvent('notifications.refresh', () => {
    void invalidateNotifications(queryClient);
  });

  // Events sent while the stream was down are lost, so a reconnect asks the api again.
  const connected = useRealtimeConnected();
  const wasConnected = useRef(connected);
  useEffect(() => {
    if (connected && !wasConnected.current) void invalidateNotifications(queryClient);
    wasConnected.current = connected;
  }, [connected, queryClient]);
}
