'use client';

import { useQuery } from '@tanstack/react-query';

import { catalogApi } from '../api/catalog-api';
import { learningKeys, retryOnServerError } from './query-keys';

/** A published subject with its topics and subtopics (locked ones are marked by `hasAccess`). */
export function useStudentSubject(subjectId: string) {
  return useQuery({
    queryKey: learningKeys.subject(subjectId),
    queryFn: () => catalogApi.subject(subjectId),
    retry: retryOnServerError,
  });
}

export function useStudentSubtopic(subtopicId: string) {
  return useQuery({
    queryKey: learningKeys.subtopic(subtopicId),
    queryFn: () => catalogApi.subtopic(subtopicId),
    retry: retryOnServerError,
  });
}
