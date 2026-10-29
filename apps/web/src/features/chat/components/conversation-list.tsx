'use client';

import type { ChatStatus } from '@formula/shared';
import { Loader2 } from 'lucide-react';

import { EmptyState } from '@/components/common/empty-state';
import { SearchField } from '@/components/common/search-field';
import { SegmentedControl } from '@/components/common/segmented-control';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useDebouncedValue } from '@/hooks/use-debounced-value';
import { t } from '@/locales';

import { useClock } from '../hooks/use-clock';
import { useConversations } from '../hooks/use-conversations';
import { ConversationRow } from './conversation-row';

const SEARCH_DELAY_MS = 300;

interface ConversationListProps {
  status: ChatStatus;
  onStatusChange: (status: ChatStatus) => void;
  search: string;
  onSearchChange: (search: string) => void;
  selectedId: string | null;
  onSelect: (conversationId: string) => void;
}

function ListSkeleton() {
  return (
    <div role="status" aria-label={t.common.loading} className="flex flex-col gap-1 p-3">
      {Array.from({ length: 6 }, (_, index) => (
        <div key={index} className="flex items-center gap-3 px-3 py-3">
          <Skeleton className="size-10 shrink-0 rounded-full" />
          <div className="flex flex-1 flex-col gap-2">
            <Skeleton className="h-4 w-2/5" />
            <Skeleton className="h-3 w-4/5" />
          </div>
        </div>
      ))}
    </div>
  );
}

/**
 * The inbox: search, "open / closed", and one row per student, newest activity first. The rows
 * are kept live by `useInboxRealtime` (mounted by the page), so a new message moves its row to
 * the top with an unread badge without a reload.
 */
export function ConversationList({
  status,
  onStatusChange,
  search,
  onSearchChange,
  selectedId,
  onSelect,
}: ConversationListProps) {
  const copy = t.chat.admin.list;
  const now = useClock();
  const q = useDebouncedValue(search.trim(), SEARCH_DELAY_MS);
  const list = useConversations({ status, q });
  const items = (list.data ?? []).flatMap((page) => page.items);
  const filtered = q !== '';

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-3">
      <div className="flex flex-col gap-3">
        <SearchField
          aria-label={copy.search}
          placeholder={copy.searchPlaceholder}
          value={search}
          onChange={(event) => onSearchChange(event.target.value)}
        />
        <SegmentedControl
          label={copy.filterLabel}
          value={status}
          onValueChange={onStatusChange}
          items={[
            { id: 'open', label: copy.open },
            { id: 'closed', label: copy.closed },
          ]}
        />
      </div>

      <div className="bg-surface-raised border-border min-h-0 flex-1 overflow-y-auto rounded-2xl border">
        {list.isError && items.length === 0 ? (
          <div role="alert" className="p-3">
            <EmptyState
              title={copy.loadError}
              className="border-0 py-10"
              action={
                <Button type="button" variant="secondary" onClick={() => void list.refetch()}>
                  {t.chat.thread.retry}
                </Button>
              }
            />
          </div>
        ) : list.isPending ? (
          <ListSkeleton />
        ) : items.length === 0 ? (
          <div className="p-3">
            <EmptyState
              title={
                filtered ? copy.noMatches : status === 'closed' ? copy.emptyClosed : copy.empty
              }
              description={
                filtered ? copy.noMatchesHint : status === 'open' ? copy.emptyHint : undefined
              }
              className="border-0 py-10"
            />
          </div>
        ) : (
          <>
            <ul
              aria-label={copy.label}
              aria-busy={list.isFetching && !list.isFetchingNextPage}
              className="divide-border divide-y"
            >
              {items.map((conversation) => (
                <ConversationRow
                  key={conversation.id}
                  conversation={conversation}
                  selected={conversation.id === selectedId}
                  now={now}
                  onSelect={onSelect}
                />
              ))}
            </ul>
            {list.hasNextPage ? (
              <div className="flex justify-center p-3">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  disabled={list.isFetchingNextPage}
                  onClick={() => void list.fetchNextPage()}
                >
                  {list.isFetchingNextPage ? (
                    <Loader2 className="animate-spin" aria-hidden />
                  ) : null}
                  {copy.loadMore}
                </Button>
              </div>
            ) : null}
          </>
        )}
      </div>
    </div>
  );
}
