import type { NotificationItem, NotificationSummary, PaginationMeta } from '@formula/shared';
import type { InfiniteData, QueryClient } from '@tanstack/react-query';

import { ApiClientError } from '@/lib/api-client';

export interface NotificationPage {
  items: NotificationItem[];
  meta: PaginationMeta;
}

export type NotificationListData = InfiniteData<NotificationPage, number>;

export const notificationKeys = {
  all: ['notifications'] as const,
  /** Prefix of every list (the full feed and the unread-only feed). */
  lists: ['notifications', 'list'] as const,
  /** One infinite list per filter; the bell shows the head of the full one. */
  list: (unreadOnly: boolean) => ['notifications', 'list', { unread: unreadOnly }] as const,
  summary: ['notifications', 'summary'] as const,
  /** Admin news history (`/admin/news`). */
  news: ['admin', 'news'] as const,
};

/** A 4xx answer will not change by asking again; only network and server errors are worth a retry. */
export function retryOnServerError(failureCount: number, error: unknown): boolean {
  const clientError =
    error instanceof ApiClientError && error.statusCode >= 400 && error.statusCode < 500;
  return !clientError && failureCount < 1;
}

/** Updates the unread count of the cached summary (no-op when the summary was never loaded). */
export function setUnreadCount(
  queryClient: QueryClient,
  update: number | ((current: number) => number),
): void {
  queryClient.setQueryData<NotificationSummary>(notificationKeys.summary, (old) => {
    if (!old) return old;
    const unread = typeof update === 'function' ? update(old.unread) : update;
    return { ...old, unread: Math.max(0, unread) };
  });
}

/**
 * Rewrites every cached list with `update(data, unreadOnly)`. Only lists that were loaded are
 * touched: a list that was never opened fetches fresh data when it is.
 */
export function updateLists(
  queryClient: QueryClient,
  update: (data: NotificationListData, unreadOnly: boolean) => NotificationListData,
): void {
  for (const query of queryClient.getQueryCache().findAll({ queryKey: notificationKeys.lists })) {
    const filter = query.queryKey[2] as { unread: boolean } | undefined;
    queryClient.setQueryData<NotificationListData>(query.queryKey, (old) =>
      old ? update(old, filter?.unread === true) : old,
    );
  }
}

/**
 * Applies `patch` to every cached notification. An item that became read leaves the unread-only
 * list, so the «Непрочитані» filter stays true to its name without a refetch.
 */
export function patchNotifications(
  queryClient: QueryClient,
  patch: (item: NotificationItem) => NotificationItem,
): void {
  updateLists(queryClient, (data, unreadOnly) => ({
    ...data,
    pages: data.pages.map((page) => {
      const items = page.items.map(patch);
      return unreadOnly
        ? { ...page, items: items.filter((item) => item.readAt === null) }
        : { ...page, items };
    }),
  }));
}

export function findCachedNotification(
  queryClient: QueryClient,
  id: string,
): NotificationItem | undefined {
  for (const query of queryClient.getQueryCache().findAll({ queryKey: notificationKeys.lists })) {
    const data = query.state.data as NotificationListData | undefined;
    const found = data?.pages.flatMap((page) => page.items).find((item) => item.id === id);
    if (found) return found;
  }
  return undefined;
}

/** Marks the lists, the summary and the news history as outdated. */
export function invalidateNotifications(queryClient: QueryClient): Promise<void> {
  return Promise.all([
    queryClient.invalidateQueries({ queryKey: notificationKeys.all }),
    queryClient.invalidateQueries({ queryKey: notificationKeys.news }),
  ]).then(() => undefined);
}
