'use client';

import type { ChatConversation } from '@formula/shared';
import { Image as ImageIcon } from 'lucide-react';
import type { MouseEvent } from 'react';

import { UserAvatar } from '@/components/common/user-avatar';
import { cn } from '@/lib/utils';
import { format } from '@/lib/format';
import { t } from '@/locales';

import { formatRelativeShort } from '../utils/time';

interface ConversationRowProps {
  conversation: ChatConversation;
  selected: boolean;
  now: number;
  onSelect: (conversationId: string) => void;
}

/** One student in the inbox: avatar, name, the last message, its age and the unread badge. */
export function ConversationRow({ conversation, selected, now, onSelect }: ConversationRowProps) {
  const copy = t.chat.admin.list;
  const { student, lastMessage, unreadCount } = conversation;
  const name = `${student.name} ${student.surname}`.trim();
  const unread = unreadCount > 0;

  const handleClick = (event: MouseEvent<HTMLAnchorElement>) => {
    // Plain clicks select in place; modified clicks keep their browser meaning (new tab).
    if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey)
      return;
    event.preventDefault();
    onSelect(conversation.id);
  };

  return (
    <li>
      <a
        href={`/admin/support?conversation=${conversation.id}`}
        onClick={handleClick}
        aria-current={selected ? 'true' : undefined}
        aria-label={format(copy.openFor, { name })}
        className={cn(
          'focus-visible:ring-ring flex items-center gap-3 px-3 py-3 transition-colors outline-none focus-visible:ring-[3px] focus-visible:ring-inset',
          selected ? 'bg-primary/10' : 'hover:bg-accent',
        )}
      >
        <UserAvatar name={student.name} fileId={student.avatarFileId} size="md" />
        <span className="flex min-w-0 flex-1 flex-col gap-0.5">
          <span className="flex items-baseline justify-between gap-2">
            <span
              className={cn(
                'text-body-md text-foreground truncate',
                unread ? 'font-bold' : 'font-medium',
              )}
            >
              {name}
            </span>
            {lastMessage ? (
              <time
                dateTime={lastMessage.createdAt}
                className="text-body-xs text-muted-foreground shrink-0"
              >
                {formatRelativeShort(lastMessage.createdAt, now)}
              </time>
            ) : null}
          </span>
          <span className="flex items-center justify-between gap-2">
            <span
              className={cn(
                'text-body-sm flex min-w-0 items-center gap-1 truncate',
                unread ? 'text-foreground' : 'text-muted-foreground',
              )}
            >
              {lastMessage ? (
                <>
                  {lastMessage.senderRole === 'support' ? (
                    <span className="shrink-0">{copy.you}</span>
                  ) : null}
                  {lastMessage.body ? (
                    <span className="truncate">{lastMessage.body}</span>
                  ) : lastMessage.hasImage ? (
                    <>
                      <ImageIcon className="size-3.5 shrink-0" aria-hidden />
                      <span className="truncate">{copy.photo}</span>
                    </>
                  ) : null}
                </>
              ) : (
                <span className="truncate">{copy.noMessages}</span>
              )}
            </span>
            {unread ? (
              <span
                aria-label={format(copy.unread, { count: unreadCount })}
                className="bg-primary text-primary-foreground text-body-xs flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full px-1.5 font-semibold tabular-nums"
              >
                {unreadCount}
              </span>
            ) : null}
          </span>
        </span>
      </a>
    </li>
  );
}
