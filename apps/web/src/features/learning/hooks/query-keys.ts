import type { ErrorCode } from '@formula/shared';

import { ApiClientError } from '@/lib/api-client';

import type { TestListQuery } from '../api/tests-api';
import type { ListedCollection } from '../types';

const ROOT = ['learning'] as const;

/** One place for every TanStack Query key of the learning flow, so invalidation stays predictable. */
export const learningKeys = {
  subject: (id: string) => [...ROOT, 'subject', id] as const,
  subtopic: (id: string) => [...ROOT, 'subtopic', id] as const,
  /** Prefix of every cached `StudentTestSummary[]` (lists, subtopic tests, favorites). */
  testLists: [...ROOT, 'test-lists'] as const,
  collection: (query: TestListQuery) => [...ROOT, 'test-lists', 'collection', query] as const,
  subtopicTests: (subtopicId: string) => [...ROOT, 'test-lists', 'subtopic', subtopicId] as const,
  favorites: [...ROOT, 'test-lists', 'favorites'] as const,
  test: (testId: string) => [...ROOT, 'test', testId] as const,
  filters: (collection: ListedCollection) => [...ROOT, 'test-filters', collection] as const,
  history: (testId: string) => [...ROOT, 'history', testId] as const,
  attempt: (attemptId: string) => [...ROOT, 'attempt', attemptId] as const,
  result: (attemptId: string) => [...ROOT, 'result', attemptId] as const,
  progress: [...ROOT, 'progress'] as const,
  summary: [...ROOT, 'progress', 'summary'] as const,
  subjectProgress: [...ROOT, 'progress', 'subjects'] as const,
};

/** A 4xx answer will not change by asking again; only network and server errors are worth a retry. */
export function retryOnServerError(failureCount: number, error: unknown): boolean {
  const clientError =
    error instanceof ApiClientError && error.statusCode >= 400 && error.statusCode < 500;
  return !clientError && failureCount < 1;
}

export function hasStatus(error: unknown, statusCode: number): boolean {
  return error instanceof ApiClientError && error.statusCode === statusCode;
}

/** The api answered with one of these machine-readable codes (`ERROR_CODES` of `@formula/shared`). */
export function hasErrorCode(error: unknown, ...codes: ErrorCode[]): boolean {
  return error instanceof ApiClientError && codes.includes(error.code);
}
