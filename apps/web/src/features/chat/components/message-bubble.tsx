'use client';

import { cn } from '@/lib/utils';
import { t } from '@/locales';

import type { ThreadMessage } from '../types';
import { ChatImage } from './chat-image';
import { useMessageListActions } from './message-list-context';
import { MessageText } from './message-text';

interface MessageBubbleProps {
  message: ThreadMessage;
  own: boolean;
  /** The last bubble of its group gets the "tail" corner. */
  last: boolean;
}

/** One message: a picture, text, or both. A failed one offers to retry or drop it. */
export function MessageBubble({ message, own, last }: MessageBubbleProps) {
  const actions = useMessageListActions();
  const copy = t.chat.thread;
  const sending = message.state === 'sending';
  const failed = message.state === 'failed';

  return (
    <div className={cn('flex max-w-full flex-col gap-1', own ? 'items-end' : 'items-start')}>
      <div
        className={cn(
          'flex max-w-full flex-col gap-2 rounded-2xl px-4 py-2.5 transition-opacity',
          own
            ? 'bg-primary/15 dark:bg-primary/25 text-foreground'
            : 'bg-surface-raised border-border text-foreground border',
          last && (own ? 'rounded-br-md' : 'rounded-bl-md'),
          sending && 'opacity-60',
          failed && 'border-input-error-border border',
        )}
      >
        {message.imageFileId ? (
          <button
            type="button"
            onClick={() => actions.openImage(message.imageFileId as string)}
            aria-label={copy.openImage}
            className="focus-visible:ring-ring self-start overflow-hidden rounded-xl outline-none focus-visible:ring-[3px]"
          >
            <ChatImage
              fileId={message.imageFileId}
              alt={copy.imageAlt}
              onLoad={actions.onImageLoad}
              className="max-h-64 rounded-xl"
            />
          </button>
        ) : null}
        {message.body ? <MessageText text={message.body} /> : null}
      </div>

      {failed && message.localId ? (
        <div
          role="alert"
          className="text-body-xs text-input-error-text flex items-center gap-3 px-1"
        >
          <span>{copy.failed}</span>
          <button
            type="button"
            onClick={() => actions.retrySend(message.localId as string)}
            className="font-semibold underline underline-offset-2"
          >
            {copy.retrySend}
          </button>
          <button
            type="button"
            onClick={() => actions.discardSend(message.localId as string)}
            className="underline underline-offset-2"
          >
            {copy.discard}
          </button>
        </div>
      ) : null}
    </div>
  );
}
