'use client';

import { useQueryClient } from '@tanstack/react-query';

import { useRealtimeEvent } from '@/features/realtime/hooks/use-realtime-event';

import { notificationKeys } from './query-keys';
import { useNotificationSummary } from './use-notifications';

/**
 * The numbers in the round badges of the menu, by menu key: unread support messages next to
 * «Підтримка» (a student's count is the team's answers, an admin's the students' messages) and
 * testimonials waiting for moderation next to «Відгуки». They ride on the shared summary query,
 * which a push of any chat event refreshes (the server also pushes `notifications.refresh` when a
 * testimonial arrives or is decided), so the numbers follow without polling.
 */
export function useNavBadges(): Readonly<Record<string, number>> {
  const queryClient = useQueryClient();
  const summary = useNotificationSummary();

  const refresh = () => void queryClient.invalidateQueries({ queryKey: notificationKeys.summary });
  useRealtimeEvent('chat.message', refresh);
  useRealtimeEvent('chat.read', refresh);

  return {
    support: summary.data?.chatUnread ?? 0,
    testimonials: summary.data?.pendingTestimonials ?? 0,
  };
}
