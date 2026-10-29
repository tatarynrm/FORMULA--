'use client';

import type { ChatStatus } from '@formula/shared';
import {
  keepPreviousData,
  useInfiniteQuery,
  useMutation,
  useQueryClient,
} from '@tanstack/react-query';

import { adminChatApi } from '../api/chat-api';
import type { ConversationListFilter, ConversationPage, ThreadData } from '../types';
import { upsertConversation } from '../utils/conversation-cache';
import { setConversation } from '../utils/thread-cache';
import { chatKeys, retryOnServerError } from './chat-keys';

/** Rows per page of the inbox list; the next page loads from a button at the end. */
export const CONVERSATIONS_PAGE_SIZE = 30;

/** The inbox list for one status and search, page by page, kept live by `useInboxRealtime`. */
export function useConversations(filter: ConversationListFilter) {
  return useInfiniteQuery<ConversationPage, Error, ConversationPage[], readonly unknown[], number>({
    queryKey: chatKeys.conversationList(filter),
    queryFn: ({ pageParam }) =>
      adminChatApi.conversations({
        status: filter.status,
        q: filter.q || undefined,
        page: pageParam,
        limit: CONVERSATIONS_PAGE_SIZE,
      }),
    initialPageParam: 1,
    getNextPageParam: (last) =>
      last.meta.page < last.meta.totalPages ? last.meta.page + 1 : undefined,
    select: (data) => data.pages,
    placeholderData: keepPreviousData,
    staleTime: 0,
    retry: retryOnServerError,
  });
}

/** Closes a conversation or opens it again; the open thread and the lists follow at once. */
export function useConversationStatus(conversationId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (status: ChatStatus) => adminChatApi.setStatus(conversationId, status),
    onSuccess: (conversation) => {
      queryClient.setQueryData<ThreadData>(chatKeys.adminThread(conversationId), (current) =>
        current ? setConversation(current, conversation) : current,
      );
      upsertConversation(queryClient, conversation, false);
      return queryClient.invalidateQueries({ queryKey: chatKeys.conversations });
    },
  });
}
