'use client';

import type { AdminSubject, AdminSubjectTree } from '@formula/shared';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { sortByIds } from '@/lib/sort-by-ids';

import {
  catalogApi,
  type SubjectInput,
  type SubjectPatch,
  type SubtopicInput,
  type SubtopicPatch,
  type TopicPatch,
} from '../api/catalog-api';
import { adminKeys, adminQueryOptions, invalidateContent } from './query-keys';

export function useSubjects() {
  return useQuery({
    queryKey: adminKeys.subjects,
    queryFn: catalogApi.listSubjects,
    ...adminQueryOptions,
  });
}

/** A subject with its whole tree of topics and subtopics. */
export function useSubject(id: string) {
  return useQuery({
    queryKey: adminKeys.subject(id),
    queryFn: () => catalogApi.getSubject(id),
    ...adminQueryOptions,
  });
}

export function useSubjectMutations() {
  const queryClient = useQueryClient();
  const refresh = () => invalidateContent(queryClient);

  return {
    create: useMutation({
      mutationFn: (input: SubjectInput) => catalogApi.createSubject(input),
      onSuccess: refresh,
    }),
    update: useMutation({
      mutationFn: ({ id, patch }: { id: string; patch: SubjectPatch }) =>
        catalogApi.updateSubject(id, patch),
      onSuccess: refresh,
    }),
    remove: useMutation({
      mutationFn: (id: string) => catalogApi.deleteSubject(id),
      // The page of the deleted subject is still mounted while the browser navigates away.
      onSuccess: (_result, id) => invalidateContent(queryClient, adminKeys.subject(id)),
    }),
    // The new order shows at once; a failure puts the old one back, and the list is read again.
    reorder: useMutation({
      mutationFn: (ids: string[]) => catalogApi.reorderSubjects(ids),
      onMutate: async (ids) => {
        await queryClient.cancelQueries({ queryKey: adminKeys.subjects });
        const previous = queryClient.getQueryData<AdminSubject[]>(adminKeys.subjects);
        queryClient.setQueryData<AdminSubject[]>(
          adminKeys.subjects,
          (current) => current && sortByIds(current, ids),
        );
        return { previous };
      },
      onError: (_error, _ids, context) => {
        if (context?.previous) queryClient.setQueryData(adminKeys.subjects, context.previous);
      },
      onSettled: () => queryClient.invalidateQueries({ queryKey: adminKeys.subjects }),
    }),
  };
}

/** Topics and the subtopics inside them, edited on the subject page. */
export function useTopicMutations() {
  const queryClient = useQueryClient();
  const refresh = () => invalidateContent(queryClient);

  /** Shows a new order in the cached tree right away; the result remembers the old tree. */
  async function showOrderInTree(
    subjectId: string,
    update: (tree: AdminSubjectTree) => AdminSubjectTree,
  ) {
    const key = adminKeys.subject(subjectId);
    await queryClient.cancelQueries({ queryKey: key });
    const previous = queryClient.getQueryData<AdminSubjectTree>(key);
    queryClient.setQueryData<AdminSubjectTree>(key, (current) => current && update(current));
    return { previous, key };
  }

  function restoreTree(
    _error: unknown,
    _variables: unknown,
    context: { previous: AdminSubjectTree | undefined; key: readonly unknown[] } | undefined,
  ) {
    if (context?.previous) queryClient.setQueryData(context.key, context.previous);
  }

  return {
    createTopic: useMutation({
      mutationFn: ({ subjectId, title }: { subjectId: string; title: string }) =>
        catalogApi.createTopic(subjectId, title),
      onSuccess: refresh,
    }),
    updateTopic: useMutation({
      mutationFn: ({ id, patch }: { id: string; patch: TopicPatch }) =>
        catalogApi.updateTopic(id, patch),
      onSuccess: refresh,
    }),
    removeTopic: useMutation({
      mutationFn: (id: string) => catalogApi.deleteTopic(id),
      onSuccess: refresh,
    }),
    createSubtopic: useMutation({
      mutationFn: ({ topicId, input }: { topicId: string; input: SubtopicInput }) =>
        catalogApi.createSubtopic(topicId, input),
      onSuccess: refresh,
    }),
    updateSubtopic: useMutation({
      mutationFn: ({ id, patch }: { id: string; patch: SubtopicPatch }) =>
        catalogApi.updateSubtopic(id, patch),
      onSuccess: refresh,
    }),
    removeSubtopic: useMutation({
      mutationFn: (id: string) => catalogApi.deleteSubtopic(id),
      onSuccess: refresh,
    }),
    reorderTopics: useMutation({
      mutationFn: ({ subjectId, ids }: { subjectId: string; ids: string[] }) =>
        catalogApi.reorderTopics(subjectId, ids),
      onMutate: ({ subjectId, ids }) =>
        showOrderInTree(subjectId, (tree) => ({ ...tree, topics: sortByIds(tree.topics, ids) })),
      onError: restoreTree,
      onSettled: (_result, _error, { subjectId }) =>
        queryClient.invalidateQueries({ queryKey: adminKeys.subject(subjectId) }),
    }),
    reorderSubtopics: useMutation({
      mutationFn: ({ topicId, ids }: { subjectId: string; topicId: string; ids: string[] }) =>
        catalogApi.reorderSubtopics(topicId, ids),
      onMutate: ({ subjectId, topicId, ids }) =>
        showOrderInTree(subjectId, (tree) => ({
          ...tree,
          topics: tree.topics.map((topic) =>
            topic.id === topicId ? { ...topic, subtopics: sortByIds(topic.subtopics, ids) } : topic,
          ),
        })),
      onError: restoreTree,
      onSettled: (_result, _error, { subjectId }) =>
        queryClient.invalidateQueries({ queryKey: adminKeys.subject(subjectId) }),
    }),
  };
}
