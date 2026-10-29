'use client';

import type { ChatStatus } from '@formula/shared';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useState } from 'react';

import { AdminPageHeader } from '@/features/admin/components/admin-page-header';
import { cn } from '@/lib/utils';
import { t } from '@/locales';

import { useInboxRealtime } from '../hooks/use-chat-realtime';
import { AdminThreadPane, NoConversationSelected } from './admin-thread-pane';
import { ConversationList } from './conversation-list';

const PARAM = 'conversation';
/** The id goes into an api path, so only a well-formed id is accepted from the url. */
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * The admin support page: the inbox on the left (about 360 px wide) and the open conversation on
 * the right from the lg breakpoint; on smaller screens one of them at a time, with a back button
 * in the thread. The open conversation lives in the url (conversation query parameter), so a
 * notification can link straight to it.
 */
export function AdminSupport() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const param = searchParams.get(PARAM);
  const selectedId = param && UUID.test(param) ? param : null;
  const [status, setStatus] = useState<ChatStatus>('open');
  const [search, setSearch] = useState('');
  useInboxRealtime();

  const select = useCallback(
    (conversationId: string) => router.push(`${pathname}?${PARAM}=${conversationId}`),
    [pathname, router],
  );
  const back = useCallback(() => router.replace(pathname), [pathname, router]);

  return (
    <div className="flex h-[calc(100dvh-(var(--spacing)*28))] min-h-96 flex-col gap-6 md:h-[calc(100dvh-(var(--spacing)*34))] lg:h-[calc(100dvh-(var(--spacing)*30))]">
      <AdminPageHeader title={t.chat.admin.title} />

      <div className="grid min-h-0 flex-1 grid-cols-1 gap-4 lg:grid-cols-[calc(var(--spacing)*90)_minmax(0,1fr)]">
        <div className={cn('min-h-0 flex-col', selectedId ? 'hidden lg:flex' : 'flex')}>
          <ConversationList
            status={status}
            onStatusChange={setStatus}
            search={search}
            onSearchChange={setSearch}
            selectedId={selectedId}
            onSelect={select}
          />
        </div>

        <div className={cn('min-h-0 min-w-0 flex-col', selectedId ? 'flex' : 'hidden lg:flex')}>
          {selectedId ? (
            <AdminThreadPane
              key={selectedId}
              conversationId={selectedId}
              onBack={back}
              onStatusKnown={setStatus}
            />
          ) : (
            <NoConversationSelected />
          )}
        </div>
      </div>
    </div>
  );
}
