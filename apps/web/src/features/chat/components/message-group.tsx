'use client';

import type { ChatParticipant, ChatSenderRole } from '@formula/shared';
import { Check, CheckCheck, Headset } from 'lucide-react';

import { UserAvatar } from '@/components/common/user-avatar';
import { cn } from '@/lib/utils';
import { format } from '@/lib/format';
import { t } from '@/locales';

import type { ThreadMessage } from '../types';
import { formatMessageTime } from '../utils/time';
import type { MessageGroup as MessageGroupData } from '../utils/timeline';
import { MessageBubble } from './message-bubble';

/** The support team has no single face: a headset on the brand tint. */
function SupportAvatar() {
  return (
    <span
      aria-hidden
      className="bg-primary/15 text-primary flex size-8 shrink-0 items-center justify-center rounded-full"
    >
      <Headset className="size-4" />
    </span>
  );
}

/** What stands under the last message this side sent: read, sent, or still on its way. */
export function ReadReceipt({ message }: { message: ThreadMessage }) {
  const copy = t.chat.thread;
  if (message.state === 'failed') return null;
  if (message.state === 'sending') return <span>{copy.sending}</span>;
  if (message.readAt) {
    return (
      <span className="text-primary flex items-center gap-1">
        <CheckCheck className="size-3.5" aria-hidden />
        {format(copy.read, { time: formatMessageTime(message.readAt) })}
      </span>
    );
  }
  return (
    <span className="flex items-center gap-1">
      <Check className="size-3.5" aria-hidden />
      {copy.sent}
    </span>
  );
}

interface MessageGroupProps {
  group: MessageGroupData;
  /** Which side this client is on: decides the avatar of the other side. */
  side: ChatSenderRole;
  student: ChatParticipant;
  /** The signed-in user: a colleague's reply shows their name even though it is "ours". */
  meId: string | undefined;
  /** Rendered under the time when this group holds the last message of this side. */
  receipt?: ThreadMessage;
}

/**
 * Consecutive messages of one sender: avatar and name once, bubbles, then the time of the last
 * one (and the read receipt under the newest message of this side).
 */
export function MessageGroup({ group, side, student, meId, receipt }: MessageGroupProps) {
  const { own } = group;
  const lastMessage = group.messages[group.messages.length - 1];
  const showName = !own || (group.senderId !== null && group.senderId !== meId);

  return (
    <div className={cn('flex items-end gap-2', own ? 'justify-end' : 'justify-start')}>
      {!own ? (
        side === 'support' ? (
          <UserAvatar name={student.name} fileId={student.avatarFileId} size="sm" />
        ) : (
          <SupportAvatar />
        )
      ) : null}

      <div
        className={cn('flex max-w-[85%] min-w-0 flex-col gap-1', own ? 'items-end' : 'items-start')}
      >
        {showName ? (
          <span className="text-body-xs text-muted-foreground px-1">{group.senderName}</span>
        ) : null}
        {group.messages.map((message, index) => (
          <MessageBubble
            key={message.id}
            message={message}
            own={own}
            last={index === group.messages.length - 1}
          />
        ))}
        {lastMessage ? (
          <span className="text-body-xs text-muted-foreground flex items-center gap-2 px-1">
            <time dateTime={lastMessage.createdAt}>{formatMessageTime(lastMessage.createdAt)}</time>
            {receipt ? <ReadReceipt message={receipt} /> : null}
          </span>
        ) : null}
      </div>
    </div>
  );
}
