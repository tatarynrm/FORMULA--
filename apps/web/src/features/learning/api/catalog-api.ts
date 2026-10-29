import type { StudentSubject, StudentSubtopic } from '@formula/shared';

import { apiFetch } from '@/lib/api-client';

export const catalogApi = {
  subject: (id: string) => apiFetch<StudentSubject>(`/v1/catalog/subjects/${id}`),
  /** Description and materials are empty while the student has no access to the subtopic. */
  subtopic: (id: string) => apiFetch<StudentSubtopic>(`/v1/catalog/subtopics/${id}`),
};
