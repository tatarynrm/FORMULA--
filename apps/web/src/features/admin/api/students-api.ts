import type {
  StudentAttemptItem,
  StudentDetail,
  StudentListItem,
  StudentListQuery,
} from '@formula/shared';

import { apiFetch, apiFetchPage } from '@/lib/api-client';

export interface StudentNamePatch {
  name?: string;
  surname?: string;
}

/** The api needs the `students` section: it answers 403 for everyone else. */
export const studentsApi = {
  list: ({ page, limit, q, online, sort }: StudentListQuery) => {
    const params = new URLSearchParams();
    if (page) params.set('page', String(page));
    if (limit) params.set('limit', String(limit));
    if (q) params.set('q', q);
    if (online) params.set('online', 'true');
    if (sort) params.set('sort', sort);
    return apiFetchPage<StudentListItem>(`/v1/admin/students?${params.toString()}`);
  },
  get: (id: string) => apiFetch<StudentDetail>(`/v1/admin/students/${id}`),
  /** Newest first. */
  attempts: (id: string, limit = 50) =>
    apiFetch<StudentAttemptItem[]>(`/v1/admin/students/${id}/attempts?limit=${limit}`),
  rename: (id: string, patch: StudentNamePatch) =>
    apiFetch<StudentDetail>(`/v1/admin/students/${id}`, { method: 'PATCH', body: patch }),
  /** Removes the account with everything it owns (attempts, grants, files). */
  remove: (id: string) => apiFetch<unknown>(`/v1/admin/students/${id}`, { method: 'DELETE' }),
};
