'use client';

import type { StudentTestSummary } from '@formula/shared';
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { attemptsApi } from '../api/attempts-api';
import { type TestListQuery, testsApi } from '../api/tests-api';
import type { ListedCollection } from '../types';
import { learningKeys, retryOnServerError } from './query-keys';

// Test lists carry the student's own progress, so they are re-read every time a screen shows them.

/** Published tests of the bases / booklets / AMPS lists. The previous result stays while a filter loads. */
export function useCollectionTests(query: TestListQuery) {
  return useQuery({
    queryKey: learningKeys.collection(query),
    queryFn: () => testsApi.list(query),
    staleTime: 0,
    placeholderData: keepPreviousData,
    retry: retryOnServerError,
  });
}

export function useTestFilters(collection: ListedCollection) {
  return useQuery({
    queryKey: learningKeys.filters(collection),
    queryFn: () => testsApi.filters(collection),
    staleTime: 5 * 60_000,
    retry: retryOnServerError,
  });
}

/** Tests of a subtopic. Pass `enabled: false` for a locked subtopic: the api answers 403 there. */
export function useSubtopicTests(subtopicId: string, enabled: boolean) {
  return useQuery({
    queryKey: learningKeys.subtopicTests(subtopicId),
    queryFn: () => testsApi.forSubtopic(subtopicId),
    enabled,
    staleTime: 0,
    retry: retryOnServerError,
  });
}

export function useFavoriteTests() {
  return useQuery({
    queryKey: learningKeys.favorites,
    queryFn: testsApi.favorites,
    staleTime: 0,
    retry: retryOnServerError,
  });
}

/** One test with the student's progress. `initialData` (from a list) avoids a visible loading step. */
export function useTest(testId: string, initialData?: StudentTestSummary) {
  return useQuery({
    queryKey: learningKeys.test(testId),
    queryFn: () => testsApi.one(testId),
    ...(initialData ? { initialData } : {}),
    staleTime: 0,
    retry: retryOnServerError,
  });
}

/** Every attempt of a test, newest first. Loaded on demand (history panel, last result lookup). */
export function useAttemptHistory(testId: string, enabled: boolean) {
  return useQuery({
    queryKey: learningKeys.history(testId),
    queryFn: () => attemptsApi.history(testId),
    enabled,
    staleTime: 0,
    retry: retryOnServerError,
  });
}

/**
 * Saves or unsaves a test. The star flips at once in every cached list and rolls back if the api
 * refuses, so the click always feels instant.
 */
export function useToggleFavorite() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ testId, favorite }: { testId: string; favorite: boolean }) => {
      await (favorite ? testsApi.addFavorite(testId) : testsApi.removeFavorite(testId));
    },

    onMutate: async ({ testId, favorite }) => {
      await queryClient.cancelQueries({ queryKey: learningKeys.testLists });
      const snapshots = queryClient.getQueriesData<StudentTestSummary[]>({
        queryKey: learningKeys.testLists,
      });

      queryClient.setQueriesData<StudentTestSummary[]>(
        { queryKey: learningKeys.testLists },
        (tests) =>
          tests?.map((test) => (test.id === testId ? { ...test, isFavorite: favorite } : test)),
      );
      queryClient.setQueryData<StudentTestSummary>(learningKeys.test(testId), (test) =>
        test ? { ...test, isFavorite: favorite } : test,
      );

      return { snapshots };
    },

    onError: (_error, { testId }, context) => {
      for (const [key, data] of context?.snapshots ?? []) queryClient.setQueryData(key, data);
      void queryClient.invalidateQueries({ queryKey: learningKeys.test(testId) });
    },

    onSettled: () => queryClient.invalidateQueries({ queryKey: learningKeys.favorites }),
  });
}
