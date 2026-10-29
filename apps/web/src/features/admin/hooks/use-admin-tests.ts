'use client';

import type { QuestionInput, TestCollection } from '@formula/shared';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { type CreateTestInput, testsAdminApi, type UpdateTestInput } from '../api/tests-api';
import { adminKeys, adminQueryOptions, editorQueryOptions, invalidateContent } from './query-keys';

/** Tests of one collection, optionally of one subtopic. */
export function useAdminTests(collection: TestCollection, subtopicId?: string) {
  return useQuery({
    queryKey: adminKeys.tests(collection, subtopicId),
    queryFn: () => testsAdminApi.list(collection, subtopicId),
    ...adminQueryOptions,
  });
}

/**
 * A test with every question and option. The editor copies it into its own form state. Pass
 * `undefined` while the test is not known yet (for example a subtopic category that has none).
 */
export function useAdminTest(id: string | undefined) {
  return useQuery({
    queryKey: adminKeys.test(id ?? ''),
    queryFn: () => testsAdminApi.get(id ?? ''),
    enabled: id !== undefined,
    ...editorQueryOptions,
  });
}

export function useTestMutations() {
  const queryClient = useQueryClient();
  const refresh = () => invalidateContent(queryClient);

  return {
    create: useMutation({
      mutationFn: (input: CreateTestInput) => testsAdminApi.create(input),
      onSuccess: refresh,
    }),
    update: useMutation({
      mutationFn: ({ id, patch }: { id: string; patch: UpdateTestInput }) =>
        testsAdminApi.update(id, patch),
      onSuccess: (test) => {
        queryClient.setQueryData(adminKeys.test(test.id), test);
        return refresh();
      },
    }),
    saveQuestions: useMutation({
      mutationFn: ({ id, questions }: { id: string; questions: QuestionInput[] }) =>
        testsAdminApi.saveQuestions(id, questions),
      onSuccess: (test) => {
        queryClient.setQueryData(adminKeys.test(test.id), test);
        return refresh();
      },
    }),
    // The editor of the deleted test stays mounted while the browser navigates away; its key is
    // not part of the invalidated content scopes, so it does not refetch.
    remove: useMutation({
      mutationFn: (id: string) => testsAdminApi.remove(id),
      onSuccess: refresh,
    }),
  };
}
