import type { ChatConversation } from '@formula/shared';
import type { InfiniteData, QueryClient } from '@tanstack/react-query';

import { chatKeys } from '../hooks/chat-keys';
import type { ConversationListFilter, ConversationPage } from '../types';

type ListData = InfiniteData<ConversationPage, number>;

/** The same match the api does for `q`: name, surname or email, case-insensitive. */
function matchesSearch(conversation: ChatConversation, q: string): boolean {
  const needle = q.trim().toLowerCase();
  if (!needle) return true;
  const { name, surname, email } = conversation.student;
  return `${name} ${surname} ${email}`.toLowerCase().includes(needle);
}

function isFilter(value: unknown): value is ConversationListFilter {
  return typeof value === 'object' && value !== null && 'status' in value && 'q' in value;
}

/** Runs `update` on every cached page of every inbox list, with the filter of that list. */
function updateLists(
  queryClient: QueryClient,
  update: (
    items: ChatConversation[],
    filter: ConversationListFilter,
    pageIndex: number,
  ) => ChatConversation[],
): void {
  for (const query of queryClient.getQueryCache().findAll({ queryKey: chatKeys.conversations })) {
    const filter = query.queryKey[3];
    if (!isFilter(filter)) continue;
    queryClient.setQueryData<ListData>(query.queryKey, (data) =>
      data
        ? {
            ...data,
            pages: data.pages.map((page, index) => ({
              ...page,
              items: update(page.items, filter, index),
            })),
          }
        : data,
    );
  }
}

/**
 * Puts a conversation where it belongs in every cached list: at the top of the lists it matches
 * (its status, the search), gone from the ones it no longer matches. `moveToTop` is for a new
 * message (last activity changed); a status toggle keeps the position when the row is already there.
 */
export function upsertConversation(
  queryClient: QueryClient,
  conversation: ChatConversation,
  moveToTop: boolean,
): void {
  updateLists(queryClient, (items, filter, pageIndex) => {
    const matches = conversation.status === filter.status && matchesSearch(conversation, filter.q);
    const index = items.findIndex((item) => item.id === conversation.id);

    if (!matches) return index === -1 ? items : items.filter((item) => item.id !== conversation.id);
    if (index !== -1 && !moveToTop) {
      return items.map((item) => (item.id === conversation.id ? conversation : item));
    }
    const rest = items.filter((item) => item.id !== conversation.id);
    return pageIndex === 0 ? [conversation, ...rest] : rest;
  });
}

/** Changes one row in place (for instance the unread badge after the thread was read). */
export function patchConversation(
  queryClient: QueryClient,
  conversationId: string,
  patch: (conversation: ChatConversation) => ChatConversation,
): void {
  updateLists(queryClient, (items) =>
    items.map((item) => (item.id === conversationId ? patch(item) : item)),
  );
}

/** The row of a conversation as the lists know it (any filter), if cached. */
export function findConversation(
  queryClient: QueryClient,
  conversationId: string,
): ChatConversation | undefined {
  for (const query of queryClient.getQueryCache().findAll({ queryKey: chatKeys.conversations })) {
    const data = query.state.data as ListData | undefined;
    for (const page of data?.pages ?? []) {
      const found = page.items.find((item) => item.id === conversationId);
      if (found) return found;
    }
  }
  return undefined;
}
