import type { ReviewDetail, ReviewGradeInput, ReviewListItem } from '@formula/shared';

import { apiFetch } from '@/lib/api-client';

export type ReviewQueueStatus = 'pending_review' | 'reviewed';

/** Grading of situational answers. The api needs the `reviews` section. */
export const reviewsApi = {
  list: (status: ReviewQueueStatus) =>
    apiFetch<ReviewListItem[]>(
      status === 'reviewed' ? '/v1/admin/reviews?status=reviewed' : '/v1/admin/reviews',
    ),
  get: (attemptId: string) => apiFetch<ReviewDetail>(`/v1/admin/reviews/${attemptId}`),
  /** Every question of the attempt needs a grade; the api answers 400 for missing or too high scores. */
  submit: (attemptId: string, grades: ReviewGradeInput[]) =>
    apiFetch<ReviewDetail>(`/v1/admin/reviews/${attemptId}`, { method: 'PUT', body: { grades } }),
};
