'use client';

import type { ChatStatus } from '@formula/shared';
import { ChevronLeft } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useRef } from 'react';

import { UserAvatar } from '@/components/common/user-avatar';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { t } from '@/locales';

import { useAdminThreadScope } from '../hooks/thread-scope';
import { useConversationStatus } from '../hooks/use-conversations';
import { useThread } from '../hooks/use-thread';
import type { ThreadScope } from '../types';
import { ChatThread } from './chat-thread';

const STATUS_STYLES: Record<ChatStatus, string> = {
  open: 'border-success bg-success-soft text-success',
  closed: 'border-transparent bg-muted text-foreground',
};

interface ThreadHeaderProps {
  scope: ThreadScope;
  conversationId: string;
  onBack: () => void;
  onStatusKnown: (status: ChatStatus) => void;
}

/** Who the student is, whether the conversation is open, and the button that changes it. */
function ThreadHeader({ scope, conversationId, onBack, onStatusKnown }: ThreadHeaderProps) {
  const copy = t.chat.admin.thread;
  const { data } = useThread(scope);
  const mutation = useConversationStatus(conversationId);
  const reported = useRef(false);
  const conversation = data?.conversation;

  // Tells the inbox once which list this conversation belongs to (a deep link may point at a closed one).
  useEffect(() => {
    if (conversation && !reported.current) {
      reported.current = true;
      onStatusKnown(conversation.status);
    }
  }, [conversation, onStatusKnown]);

  const student = conversation?.student;
  const name = student ? `${student.name} ${student.surname}`.trim() : '';
  const open = conversation?.status === 'open';

  return (
    <header className="bg-card border-border flex flex-wrap items-center gap-x-3 gap-y-2 border-b px-3 py-3 md:px-4">
      <Button
        type="button"
        variant="ghost"
        size="icon"
        aria-label={copy.back}
        onClick={onBack}
        className="-ml-1 lg:hidden"
      >
        <ChevronLeft className="size-6" />
      </Button>

      {student && conversation ? (
        <>
          <Link
            href={`/admin/students/${student.id}`}
            aria-label={`${copy.profile}: ${name}`}
            className="group flex min-w-0 flex-1 basis-48 items-center gap-3"
          >
            <UserAvatar name={student.name} fileId={student.avatarFileId} size="md" />
            <span className="flex min-w-0 flex-col">
              <span className="text-body-md text-foreground group-hover:text-primary truncate font-bold transition-colors">
                {name}
              </span>
              <span className="text-body-sm text-muted-foreground truncate">{student.email}</span>
            </span>
          </Link>

          <span
            className={cn(
              'text-body-sm inline-flex items-center rounded-full border px-3 py-1 font-medium whitespace-nowrap',
              STATUS_STYLES[conversation.status],
            )}
          >
            {copy.status[conversation.status]}
          </span>

          <Button
            type="button"
            variant="secondary"
            size="sm"
            disabled={mutation.isPending}
            onClick={() => mutation.mutate(open ? 'closed' : 'open')}
          >
            {open ? copy.close : copy.reopen}
          </Button>

          {mutation.isError ? (
            <p role="alert" className="text-body-xs text-input-error-text basis-full">
              {copy.statusError}
            </p>
          ) : null}
        </>
      ) : (
        <span className="flex-1" />
      )}
    </header>
  );
}

interface AdminThreadPaneProps {
  conversationId: string;
  onBack: () => void;
  onStatusKnown: (status: ChatStatus) => void;
}

/** One conversation from the support side: the student header over the shared thread. */
export function AdminThreadPane({ conversationId, onBack, onStatusKnown }: AdminThreadPaneProps) {
  const scope = useAdminThreadScope(conversationId);
  const copy = t.chat.admin.thread;

  return (
    <ChatThread
      scope={scope}
      className="min-h-0 flex-1"
      header={
        <ThreadHeader
          scope={scope}
          conversationId={conversationId}
          onBack={onBack}
          onStatusKnown={onStatusKnown}
        />
      }
      empty={{ title: copy.emptyTitle, description: copy.emptyDescription }}
      notFound={{ title: copy.notFound, description: copy.notFoundHint }}
    />
  );
}

/** Shown on large screens while no conversation is selected. */
export function NoConversationSelected() {
  const copy = t.chat.admin.thread;
  return (
    <div className="bg-surface-soft border-border flex min-h-0 flex-1 flex-col items-center justify-center gap-2 rounded-2xl border p-6 text-center">
      <p className="text-body-lg text-foreground font-semibold">{copy.select}</p>
      <p className="text-body-sm text-muted-foreground max-w-sm">{copy.selectHint}</p>
    </div>
  );
}
