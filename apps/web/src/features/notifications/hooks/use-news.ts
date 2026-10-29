'use client';

import { NOTIFICATIONS, type SendBroadcastInput } from '@formula/shared';
import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import { notificationsApi } from '../api/notifications-api';
import { notificationKeys, retryOnServerError } from './query-keys';

/** News the admins sent so far, newest first, page by page. */
export function useNewsHistory() {
  const query = useInfiniteQuery({
    queryKey: notificationKeys.news,
    queryFn: ({ pageParam }) => notificationsApi.newsHistory(pageParam, NOTIFICATIONS.PAGE_SIZE),
    initialPageParam: 1,
    getNextPageParam: (last) =>
      last.meta.page < last.meta.totalPages ? last.meta.page + 1 : undefined,
    staleTime: 0,
    retry: retryOnServerError,
  });

  return {
    items: query.data?.pages.flatMap((page) => page.items) ?? [],
    isPending: query.isPending,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
    hasNextPage: query.hasNextPage,
    isFetchingNextPage: query.isFetchingNextPage,
    fetchNextPage: query.fetchNextPage,
  };
}

/** Sends a news item to every student; the history is reloaded afterwards. */
export function useSendNews() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: SendBroadcastInput) => notificationsApi.sendNews(input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: notificationKeys.news }),
  });
}
