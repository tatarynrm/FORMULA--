'use client';

import type { TestimonialStatus, UpdateTestimonialInput } from '@formula/shared';
import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
  type QueryClient,
} from '@tanstack/react-query';

import { notificationKeys } from '@/features/notifications/hooks/query-keys';
import { useRealtimeEvent } from '@/features/realtime/hooks/use-realtime-event';

import { adminTestimonialsApi, testimonialsApi } from '../api/testimonials-api';
import { testimonialKeys } from './query-keys';

const ADMIN_PAGE_SIZE = 20;

/** Published testimonials for the landing page (anyone, no sign-in). */
export function usePublicTestimonials() {
  return useQuery({
    queryKey: testimonialKeys.public,
    queryFn: testimonialsApi.listPublic,
    staleTime: 30_000,
  });
}

/** The signed-in author's own testimonials with their state. Pass `false` for a guest. */
export function useMyTestimonials(enabled: boolean) {
  return useQuery({
    queryKey: testimonialKeys.mine,
    queryFn: testimonialsApi.mine,
    enabled,
    staleTime: 15_000,
  });
}

export function useSubmitTestimonial() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: testimonialsApi.submit,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: testimonialKeys.mine }),
  });
}

// ---- Moderation ----

export function useAdminTestimonials(status: TestimonialStatus) {
  return useInfiniteQuery({
    queryKey: testimonialKeys.adminList(status),
    queryFn: ({ pageParam }) => adminTestimonialsApi.list(status, pageParam, ADMIN_PAGE_SIZE),
    initialPageParam: 1,
    getNextPageParam: (last) =>
      last.meta.page < last.meta.totalPages ? last.meta.page + 1 : undefined,
    staleTime: 0,
  });
}

export function useTestimonialCounts() {
  return useQuery({
    queryKey: testimonialKeys.counts,
    queryFn: adminTestimonialsApi.counts,
    staleTime: 0,
  });
}

/** The moderation lists, the tab counters and the pending number in the menu are all outdated. */
function refreshModeration(queryClient: QueryClient): Promise<unknown> {
  return Promise.all([
    queryClient.invalidateQueries({ queryKey: testimonialKeys.admin }),
    queryClient.invalidateQueries({ queryKey: testimonialKeys.public }),
    queryClient.invalidateQueries({ queryKey: notificationKeys.summary }),
  ]);
}

export function useUpdateTestimonial() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateTestimonialInput }) =>
      adminTestimonialsApi.update(id, input),
    onSuccess: () => refreshModeration(queryClient),
  });
}

export function useDeleteTestimonial() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: adminTestimonialsApi.remove,
    onSuccess: () => refreshModeration(queryClient),
  });
}

/** A testimonial arrived or another admin decided one: the open moderation page reloads. */
export function useModerationRealtime(): void {
  const queryClient = useQueryClient();
  const refresh = () => void queryClient.invalidateQueries({ queryKey: testimonialKeys.admin });
  useRealtimeEvent('notifications.refresh', refresh);
  useRealtimeEvent('notification', ({ notification }) => {
    if (notification.type === 'testimonial_pending') refresh();
  });
}
