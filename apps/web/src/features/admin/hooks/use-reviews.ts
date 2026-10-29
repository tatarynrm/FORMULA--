'use client';

import type { ReviewGradeInput } from '@formula/shared';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { type ReviewQueueStatus, reviewsApi } from '../api/reviews-api';
import { adminKeys, adminQueryOptions, editorQueryOptions } from './query-keys';

/** Attempts waiting for a grade (`pending_review`) or already graded (`reviewed`). */
export function useReviewQueue(status: ReviewQueueStatus, enabled = true) {
  return useQuery({
    queryKey: adminKeys.reviews(status),
    queryFn: () => reviewsApi.list(status),
    enabled,
    ...adminQueryOptions,
  });
}

/** One attempt with the answers and the model answers. The grading form copies it once. */
export function useReview(attemptId: string) {
  return useQuery({
    queryKey: adminKeys.review(attemptId),
    queryFn: () => reviewsApi.get(attemptId),
    ...editorQueryOptions,
  });
}

export function useSubmitReview(attemptId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (grades: ReviewGradeInput[]) => reviewsApi.submit(attemptId, grades),
    onSuccess: async (detail) => {
      queryClient.setQueryData(adminKeys.review(attemptId), detail);
      await queryClient.invalidateQueries({ queryKey: adminKeys.reviewsAll });
    },
  });
}
