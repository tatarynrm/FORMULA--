import type { StudentTestSummary, TestFilterOptions } from '@formula/shared';

import { apiFetch } from '@/lib/api-client';

import type { ListedCollection, TestFilterValues } from '../types';

export interface TestListQuery extends TestFilterValues {
  collection: ListedCollection;
  /** Free text matched against the test title. */
  q?: string;
}

function toSearch(query: TestListQuery): string {
  const params = new URLSearchParams({ collection: query.collection });
  if (query.category) params.set('category', query.category);
  if (query.year) params.set('year', String(query.year));
  if (query.specialty) params.set('specialty', query.specialty);
  const text = query.q?.trim();
  if (text) params.set('q', text);
  return params.toString();
}

export const testsApi = {
  list: (query: TestListQuery) => apiFetch<StudentTestSummary[]>(`/v1/tests?${toSearch(query)}`),
  filters: (collection: ListedCollection) =>
    apiFetch<TestFilterOptions>(`/v1/tests/filters?collection=${collection}`),
  one: (testId: string) => apiFetch<StudentTestSummary>(`/v1/tests/${testId}`),
  /** Answers 403 while the student has no access to the subtopic, so ask only for open ones. */
  forSubtopic: (subtopicId: string) =>
    apiFetch<StudentTestSummary[]>(`/v1/subtopics/${subtopicId}/tests`),
  favorites: () => apiFetch<StudentTestSummary[]>('/v1/favorites'),
  addFavorite: (testId: string) =>
    apiFetch<{ saved: true }>(`/v1/favorites/${testId}`, { method: 'PUT' }),
  removeFavorite: (testId: string) =>
    apiFetch<{ saved: false }>(`/v1/favorites/${testId}`, { method: 'DELETE' }),
};
