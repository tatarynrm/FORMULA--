import type { CatalogSubtopic, SubjectGrant, SubtopicGrant } from '@formula/shared';

import { apiFetch } from '@/lib/api-client';

/**
 * What a student may open: a whole subject (every subtopic, also the ones added later) or single
 * subtopics. The api needs the `students` section. Every grant call answers with the student's
 * updated list.
 */
export const accessApi = {
  /** Flat list of every subtopic, for the "give access" picker. */
  listSubtopics: () => apiFetch<CatalogSubtopic[]>('/v1/admin/catalog/subtopics'),

  listGrants: (userId: string) => apiFetch<SubtopicGrant[]>(`/v1/admin/students/${userId}/access`),
  revoke: (userId: string, subtopicId: string) =>
    apiFetch<SubtopicGrant[]>(`/v1/admin/students/${userId}/access/${subtopicId}`, {
      method: 'DELETE',
    }),
  /** Makes the single-subtopic grants of the student exactly `subtopicIds`. */
  setGrants: (userId: string, subtopicIds: string[]) =>
    apiFetch<SubtopicGrant[]>(`/v1/admin/students/${userId}/access`, {
      method: 'PUT',
      body: { subtopicIds },
    }),

  listSubjectGrants: (userId: string) =>
    apiFetch<SubjectGrant[]>(`/v1/admin/students/${userId}/subject-access`),
  grantSubject: (userId: string, subjectId: string) =>
    apiFetch<SubjectGrant[]>(`/v1/admin/students/${userId}/subject-access/${subjectId}`, {
      method: 'PUT',
    }),
  revokeSubject: (userId: string, subjectId: string) =>
    apiFetch<SubjectGrant[]>(`/v1/admin/students/${userId}/subject-access/${subjectId}`, {
      method: 'DELETE',
    }),
};
