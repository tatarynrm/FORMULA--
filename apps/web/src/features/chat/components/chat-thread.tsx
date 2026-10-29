'use client';

import { Loader2 } from 'lucide-react';
import type { ReactNode } from 'react';

import { EmptyState } from '@/components/common/empty-state';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useCurrentUser } from '@/features/auth/hooks/use-current-user';
import { ApiClientError } from '@/lib/api-client';
import { cn } from '@/lib/utils';
import { format } from '@/lib/format';
import { t } from '@/locales';

import { useReconnecting, useThreadRealtime } from '../hooks/use-chat-realtime';
import { useMarkRead } from '../hooks/use-mark-read';
import { useOlderMessages } from '../hooks/use-older-messages';
import { useSendMessage } from '../hooks/use-send-message';
import { useThread } from '../hooks/use-thread';
import { useTyping } from '../hooks/use-typing';
import type { ThreadScope } from '../types';
import { Composer } from './composer';
import { MessageList } from './message-list';

/** A row of placeholder bubbles while the thread loads. */
function ThreadSkeleton() {
  const rows = [
    { own: false, width: 'w-48' },
    { own: false, width: 'w-64' },
    { own: true, width: 'w-56' },
    { own: false, width: 'w-40' },
    { own: true, width: 'w-72' },
  ];
  return (
    <div
      role="status"
      aria-label={t.common.loading}
      className="flex min-h-0 flex-1 flex-col justify-end gap-3 px-3 py-4 md:px-4"
    >
      {rows.map((row, index) => (
        <div key={index} className={cn('flex', row.own ? 'justify-end' : 'justify-start')}>
          <Skeleton className={cn('h-11 max-w-[85%] rounded-2xl', row.width)} />
        </div>
      ))}
    </div>
  );
}

function TypingRow({ name }: { name: string | null }) {
  return (
    <div
      aria-live="polite"
      className="text-body-xs text-muted-foreground flex h-6 items-center gap-1.5 px-4"
    >
      {name ? (
        <>
          <span className="flex items-center gap-0.5" aria-hidden>
            <span className="bg-muted-foreground size-1 animate-pulse rounded-full" />
            <span className="bg-muted-foreground size-1 animate-pulse rounded-full [animation-delay:150ms]" />
            <span className="bg-muted-foreground size-1 animate-pulse rounded-full [animation-delay:300ms]" />
          </span>
          {format(t.chat.thread.typing, { name })}
        </>
      ) : null}
    </div>
  );
}

function ConnectionBanner() {
  return (
    <div
      role="status"
      className="bg-muted text-body-xs text-text-secondary flex items-center justify-center gap-2 px-4 py-1.5"
    >
      <Loader2 className="size-3.5 animate-spin" aria-hidden />
      {t.chat.thread.reconnecting}
    </div>
  );
}

interface ChatThreadProps {
  scope: ThreadScope;
  /** Shown inside the list while the conversation has no messages. */
  empty: { title: string; description: string };
  /** Rendered above the messages (the admin's student header). */
  header?: ReactNode;
  /** Shown instead of the generic error when the api answers 404 (the conversation is gone). */
  notFound?: { title: string; description: string };
  className?: string;
}

/**
 * One conversation, for either side: the messages, who is typing, the message box, and a
 * banner while the live stream is down. Live events, optimistic sending and read receipts are
 * wired here, so the student page and the admin inbox only choose the scope.
 */
export function ChatThread({ scope, empty, header, notFound, className }: ChatThreadProps) {
  const copy = t.chat.thread;
  const { data: me } = useCurrentUser();
  const thread = useThread(scope);
  useThreadRealtime(scope);
  const older = useOlderMessages(scope);
  const sender = useSendMessage(scope, me);
  const { typingName, notifyTyping } = useTyping(scope, thread.data?.conversation.id);
  useMarkRead(scope, thread.data);
  const reconnecting = useReconnecting();

  // 404: the conversation is gone; 400: its id in the url is malformed. Either way asking again will not help.
  const gone =
    thread.isError &&
    thread.error instanceof ApiClientError &&
    (thread.error.statusCode === 404 || thread.error.statusCode === 400);

  return (
    <section
      aria-label={copy.log}
      className={cn(
        'bg-surface-soft border-border flex min-h-0 flex-col overflow-hidden rounded-2xl border',
        className,
      )}
    >
      {header}
      {reconnecting ? <ConnectionBanner /> : null}

      {thread.isPending ? (
        <ThreadSkeleton />
      ) : thread.isError ? (
        <div role="alert" className="flex min-h-0 flex-1 items-center justify-center p-4">
          <EmptyState
            title={gone && notFound ? notFound.title : copy.loadError}
            description={gone && notFound ? notFound.description : copy.loadErrorHint}
            className="w-full max-w-md"
            action={
              gone ? undefined : (
                <Button type="button" variant="secondary" onClick={() => void thread.refetch()}>
                  {copy.retry}
                </Button>
              )
            }
          />
        </div>
      ) : (
        <MessageList
          data={thread.data}
          side={scope.side}
          meId={me?.id}
          empty={empty}
          loadingOlder={older.isLoading}
          olderError={older.isError}
          onLoadOlder={older.loadOlder}
          onRetry={sender.retry}
          onDiscard={sender.discard}
        />
      )}

      <TypingRow name={typingName} />
      <Composer disabled={!thread.data || gone} onSend={sender.send} onTyping={notifyTyping} />
    </section>
  );
}
