import type {
  AdminSubject,
  AdminSubjectTree,
  AdminSubtopic,
  ContentStatus,
  Material,
  MaterialKind,
} from '@formula/shared';

import { apiFetch } from '@/lib/api-client';

export interface SubjectInput {
  title: string;
  description?: string | null;
}

export interface SubjectPatch extends Partial<SubjectInput> {
  status?: ContentStatus;
}

export interface TopicPatch {
  title?: string;
  status?: ContentStatus;
}

export interface SubtopicInput {
  title: string;
  isFree?: boolean;
}

export interface SubtopicPatch {
  title?: string;
  /** Rich text from the editor; the api sanitizes it. */
  descriptionHtml?: string;
  isFree?: boolean;
  status?: ContentStatus;
}

export interface MaterialInput {
  kind: MaterialKind;
  title: string;
  /** Id returned by `POST /uploads` (the purpose must match the kind). */
  fileId: string;
}

/** Subjects, topics, subtopics and their materials. The api needs the `subjects` section. */
export const catalogApi = {
  listSubjects: () => apiFetch<AdminSubject[]>('/admin/subjects'),
  getSubject: (id: string) => apiFetch<AdminSubjectTree>(`/admin/subjects/${id}`),
  createSubject: (input: SubjectInput) =>
    apiFetch<AdminSubject>('/admin/subjects', { method: 'POST', body: input }),
  updateSubject: (id: string, patch: SubjectPatch) =>
    apiFetch<AdminSubject>(`/admin/subjects/${id}`, { method: 'PATCH', body: patch }),
  deleteSubject: (id: string) =>
    apiFetch<{ deleted: true }>(`/admin/subjects/${id}`, { method: 'DELETE' }),

  createTopic: (subjectId: string, title: string) =>
    apiFetch<AdminSubjectTree>(`/admin/subjects/${subjectId}/topics`, {
      method: 'POST',
      body: { title },
    }),
  updateTopic: (id: string, patch: TopicPatch) =>
    apiFetch<{ updated: true }>(`/admin/topics/${id}`, { method: 'PATCH', body: patch }),
  deleteTopic: (id: string) =>
    apiFetch<{ deleted: true }>(`/admin/topics/${id}`, { method: 'DELETE' }),

  createSubtopic: (topicId: string, input: SubtopicInput) =>
    apiFetch<{ id: string }>(`/admin/topics/${topicId}/subtopics`, {
      method: 'POST',
      body: input,
    }),
  getSubtopic: (id: string) => apiFetch<AdminSubtopic>(`/admin/subtopics/${id}`),
  updateSubtopic: (id: string, patch: SubtopicPatch) =>
    apiFetch<AdminSubtopic>(`/admin/subtopics/${id}`, { method: 'PATCH', body: patch }),
  deleteSubtopic: (id: string) =>
    apiFetch<{ deleted: true }>(`/admin/subtopics/${id}`, { method: 'DELETE' }),

  // Ordering: `ids` are the ids of ALL siblings in the new order.
  reorderSubjects: (ids: string[]) =>
    apiFetch<{ ordered: true }>('/admin/subjects/order', { method: 'PUT', body: { ids } }),
  reorderTopics: (subjectId: string, ids: string[]) =>
    apiFetch<{ ordered: true }>(`/admin/subjects/${subjectId}/topics/order`, {
      method: 'PUT',
      body: { ids },
    }),
  reorderSubtopics: (topicId: string, ids: string[]) =>
    apiFetch<{ ordered: true }>(`/admin/topics/${topicId}/subtopics/order`, {
      method: 'PUT',
      body: { ids },
    }),
  reorderMaterials: (subtopicId: string, ids: string[]) =>
    apiFetch<{ ordered: true }>(`/admin/subtopics/${subtopicId}/materials/order`, {
      method: 'PUT',
      body: { ids },
    }),

  addMaterial: (subtopicId: string, input: MaterialInput) =>
    apiFetch<Material>(`/admin/subtopics/${subtopicId}/materials`, {
      method: 'POST',
      body: input,
    }),
  renameMaterial: (id: string, title: string) =>
    apiFetch<{ updated: true }>(`/admin/materials/${id}`, { method: 'PATCH', body: { title } }),
  deleteMaterial: (id: string) =>
    apiFetch<{ deleted: true }>(`/admin/materials/${id}`, { method: 'DELETE' }),
};
