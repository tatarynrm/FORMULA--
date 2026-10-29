import type {
  AdminTest,
  ContentStatus,
  QuestionInput,
  TestCollection,
  TestKind,
  TestSummary,
} from '@formula/shared';

import { apiFetch } from '@/lib/api-client';

export interface CreateTestInput {
  kind: TestKind;
  collection: TestCollection;
  /** Required for the `subtopic` collection, forbidden for the others. */
  subtopicId?: string;
  title: string;
  description?: string | null;
  category?: string | null;
  year?: number | null;
  specialty?: string | null;
  /** Total time for the whole test, in seconds (10 to 86400). */
  timeLimitSeconds?: number | null;
}

export interface UpdateTestInput {
  /** Only while the test has no questions (the api answers 409 otherwise). */
  kind?: TestKind;
  title?: string;
  description?: string | null;
  category?: string | null;
  year?: number | null;
  specialty?: string | null;
  status?: ContentStatus;
  timeLimitSeconds?: number | null;
}

/**
 * Tests of every collection (subtopic tests, bases, booklets, AMPS). The api checks the section of
 * the collection on every call.
 */
export const testsAdminApi = {
  list: (collection: TestCollection, subtopicId?: string) => {
    const query = new URLSearchParams({ collection });
    if (subtopicId) query.set('subtopicId', subtopicId);
    return apiFetch<TestSummary[]>(`/v1/admin/tests?${query.toString()}`);
  },
  get: (id: string) => apiFetch<AdminTest>(`/v1/admin/tests/${id}`),
  create: (input: CreateTestInput) =>
    apiFetch<AdminTest>('/v1/admin/tests', { method: 'POST', body: input }),
  update: (id: string, patch: UpdateTestInput) =>
    apiFetch<AdminTest>(`/v1/admin/tests/${id}`, { method: 'PATCH', body: patch }),
  remove: (id: string) =>
    apiFetch<{ deleted: true }>(`/v1/admin/tests/${id}`, { method: 'DELETE' }),
  /** Replaces all questions. Ids of existing questions and options are kept so attempt history survives. */
  saveQuestions: (id: string, questions: QuestionInput[]) =>
    apiFetch<AdminTest>(`/v1/admin/tests/${id}/questions`, { method: 'PUT', body: { questions } }),
};
