'use client';

import { useQuery } from '@tanstack/react-query';

import { progressApi } from '../api/progress-api';
import { learningKeys, retryOnServerError } from './query-keys';

/** Numbers for the home screen. They change after every finished test, so they are always re-read. */
export function useProgressSummary() {
  return useQuery({
    queryKey: learningKeys.summary,
    queryFn: progressApi.summary,
    staleTime: 0,
    retry: retryOnServerError,
  });
}

export function useSubjectProgress() {
  return useQuery({
    queryKey: learningKeys.subjectProgress,
    queryFn: progressApi.subjects,
    staleTime: 0,
    retry: retryOnServerError,
  });
}
