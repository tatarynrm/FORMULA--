import type { StudentListQuery, TestCollection } from '@formula/shared';
import type { QueryClient, QueryKey } from '@tanstack/react-query';

import { ApiClientError } from '@/lib/api-client';

import type { ReviewQueueStatus } from '../api/reviews-api';

/** Query keys of the admin content builder. Everything starts with `admin` so it never clashes. */
export const adminKeys = {
  subjects: ['admin', 'subjects'] as const,
  subject: (id: string) => ['admin', 'subject', id] as const,
  subtopic: (id: string) => ['admin', 'subtopic', id] as const,
  /** Tests of one collection, optionally narrowed to one subtopic. */
  tests: (collection: TestCollection, subtopicId?: string) =>
    ['admin', 'tests', collection, subtopicId ?? 'all'] as const,
  test: (id: string) => ['admin', 'test', id] as const,
  reviews: (status: ReviewQueueStatus) => ['admin', 'reviews', status] as const,
  reviewsAll: ['admin', 'reviews'] as const,
  review: (attemptId: string) => ['admin', 'review', attemptId] as const,
  /** Every page and filter of the students list. */
  studentsAll: ['admin', 'students'] as const,
  students: (query: StudentListQuery) => ['admin', 'students', 'list', query] as const,
  student: (id: string) => ['admin', 'student', id] as const,
  studentAttempts: (id: string) => ['admin', 'student', id, 'attempts'] as const,
  catalogSubtopics: ['admin', 'catalog-subtopics'] as const,
  access: (userId: string) => ['admin', 'access', userId] as const,
  subjectAccess: (userId: string) => ['admin', 'subject-access', userId] as const,
};

/**
 * Admin data is edited by people, so it is always re-checked on mount (`staleTime: 0`). A 4xx answer
 * (not found, no rights) will not change by asking again, so only network and server errors retry.
 */
export const adminQueryOptions = {
  staleTime: 0,
  retry: (failureCount: number, error: unknown) =>
    !(error instanceof ApiClientError && error.statusCode >= 400 && error.statusCode < 500) &&
    failureCount < 1,
} as const;

/**
 * Same, for editors that copy the loaded data into their own form state once. Dropping the cache
 * when the page closes makes the next visit start from fresh data instead of a stale copy.
 */
export const editorQueryOptions = { ...adminQueryOptions, gcTime: 0 } as const;

/** Queries that show counts or lists of content; any content change can make them outdated. */
const CONTENT_SCOPES = new Set(['subjects', 'subject', 'subtopic', 'tests']);

/**
 * Marks the content queries as outdated after a change, so every list and tree shows fresh counts.
 * `except` keeps the page that is being deleted from refetching (it would answer 404 while the
 * browser navigates away).
 */
export function invalidateContent(queryClient: QueryClient, except?: QueryKey): Promise<void> {
  return queryClient.invalidateQueries({
    predicate: (query) => {
      const [root, scope, id] = query.queryKey;
      if (root !== 'admin' || typeof scope !== 'string' || !CONTENT_SCOPES.has(scope)) return false;
      return !(except && except[1] === scope && except[2] === id);
    },
  });
}

/** After a change of a student's grants or name: their page and every list are outdated. */
export function invalidateStudent(queryClient: QueryClient, userId: string): Promise<void> {
  return Promise.all([
    queryClient.invalidateQueries({ queryKey: adminKeys.student(userId) }),
    queryClient.invalidateQueries({ queryKey: adminKeys.studentsAll }),
  ]).then(() => undefined);
}
