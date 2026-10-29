'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';

import type { ThreadData, ThreadScope } from '../types';
import { prependMessages } from '../utils/thread-cache';

/** Loads the page before the oldest message on screen and puts it in front of the thread. */
export function useOlderMessages(scope: ThreadScope) {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (before: string) => scope.endpoints.older(before),
    onSuccess: (page) => {
      queryClient.setQueryData<ThreadData>(scope.queryKey, (current) =>
        current ? prependMessages(current, page) : current,
      );
    },
  });

  return {
    loadOlder: (before: string) => {
      if (!mutation.isPending) mutation.mutate(before);
    },
    isLoading: mutation.isPending,
    isError: mutation.isError,
  };
}
