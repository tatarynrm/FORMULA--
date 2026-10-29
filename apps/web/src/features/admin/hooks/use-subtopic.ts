'use client';

import type { AdminSubtopic } from '@formula/shared';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { sortByIds } from '@/lib/sort-by-ids';

import { catalogApi, type MaterialInput, type SubtopicPatch } from '../api/catalog-api';
import { adminKeys, editorQueryOptions, invalidateContent } from './query-keys';

/** A subtopic with its description and materials. The editor copies it into its own form state. */
export function useSubtopic(id: string) {
  return useQuery({
    queryKey: adminKeys.subtopic(id),
    queryFn: () => catalogApi.getSubtopic(id),
    ...editorQueryOptions,
  });
}

export function useSubtopicMutations(subtopicId: string) {
  const queryClient = useQueryClient();
  const refresh = () => invalidateContent(queryClient);

  return {
    update: useMutation({
      mutationFn: (patch: SubtopicPatch) => catalogApi.updateSubtopic(subtopicId, patch),
      onSuccess: (subtopic) => {
        queryClient.setQueryData(adminKeys.subtopic(subtopicId), subtopic);
        return refresh();
      },
    }),
    remove: useMutation({
      mutationFn: () => catalogApi.deleteSubtopic(subtopicId),
      // The page of the deleted subtopic is still mounted while the browser navigates away.
      onSuccess: () => invalidateContent(queryClient, adminKeys.subtopic(subtopicId)),
    }),
    addMaterial: useMutation({
      mutationFn: (input: MaterialInput) => catalogApi.addMaterial(subtopicId, input),
      onSuccess: refresh,
    }),
    renameMaterial: useMutation({
      mutationFn: ({ id, title }: { id: string; title: string }) =>
        catalogApi.renameMaterial(id, title),
      onSuccess: refresh,
    }),
    removeMaterial: useMutation({
      mutationFn: (id: string) => catalogApi.deleteMaterial(id),
      onSuccess: refresh,
    }),
    // The new order shows at once; a failure puts the old one back, and the subtopic is read again.
    reorderMaterials: useMutation({
      mutationFn: (ids: string[]) => catalogApi.reorderMaterials(subtopicId, ids),
      onMutate: async (ids) => {
        const key = adminKeys.subtopic(subtopicId);
        await queryClient.cancelQueries({ queryKey: key });
        const previous = queryClient.getQueryData<AdminSubtopic>(key);
        queryClient.setQueryData<AdminSubtopic>(
          key,
          (current) => current && { ...current, materials: sortByIds(current.materials, ids) },
        );
        return { previous };
      },
      onError: (_error, _ids, context) => {
        if (context?.previous) {
          queryClient.setQueryData(adminKeys.subtopic(subtopicId), context.previous);
        }
      },
      onSettled: () => queryClient.invalidateQueries({ queryKey: adminKeys.subtopic(subtopicId) }),
    }),
  };
}
