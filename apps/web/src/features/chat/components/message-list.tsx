'use client';

import type { ChatSenderRole } from '@formula/shared';
import { ArrowDown, Loader2, MessageCircle } from 'lucide-react';
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';

import { cn } from '@/lib/utils';
import { t } from '@/locales';

import { useClock } from '../hooks/use-clock';
import type { StatusNotice, ThreadData } from '../types';
import { formatMessageTime } from '../utils/time';
import { buildTimeline, lastOwnMessage } from '../utils/timeline';
import { ImageLightbox } from './image-lightbox';
import { MessageGroup } from './message-group';
import { type MessageListActions, MessageListContext } from './message-list-context';

/** Closer than this to the end counts as "at the bottom": new messages scroll into view by themselves. */
const NEAR_BOTTOM_PX = 96;
/** Older messages start loading this far before the top is reached. */
const LOAD_AHEAD = '160px 0px 0px 0px';

interface MessageListProps {
  data: ThreadData;
  side: ChatSenderRole;
  meId: string | undefined;
  empty: { title: string; description: string };
  loadingOlder: boolean;
  olderError: boolean;
  onLoadOlder: (before: string) => void;
  onRetry: (localId: string) => void;
  onDiscard: (localId: string) => void;
}

function DaySeparator({ label }: { label: string }) {
  return (
    <div role="separator" aria-label={label} className="flex items-center gap-3 py-1">
      <span className="border-border flex-1 border-t" />
      <span className="text-body-xs text-muted-foreground font-medium">{label}</span>
      <span className="border-border flex-1 border-t" />
    </div>
  );
}

function NoticeRow({ notice }: { notice: StatusNotice }) {
  const copy = t.chat.thread;
  return (
    <div className="flex justify-center py-1">
      <span className="bg-muted text-body-xs text-text-secondary rounded-full px-3 py-1">
        {notice.status === 'closed' ? copy.closed : copy.reopened} · {formatMessageTime(notice.at)}
      </span>
    </div>
  );
}

/**
 * The scrollable messages. It opens at the bottom, loads older pages when scrolled to the top
 * (keeping what is on screen in place), follows new messages while the reader is at the bottom,
 * and otherwise offers a "new messages" pill. Pictures that load above the viewport do not push
 * the view either.
 */
export function MessageList({
  data,
  side,
  meId,
  empty,
  loadingOlder,
  olderError,
  onLoadOlder,
  onRetry,
  onDiscard,
}: MessageListProps) {
  const copy = t.chat.thread;
  const now = useClock();
  const containerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);
  /** Whether the reader is at the bottom and new content should scroll into view. */
  const stickRef = useRef(true);
  /** Scroll metrics taken before an older page was requested, to restore the view after it is prepended. */
  const anchorRef = useRef<{ height: number; top: number } | null>(null);
  const readyRef = useRef(false);
  const [unseen, setUnseen] = useState(0);
  const [lightbox, setLightbox] = useState<string | null>(null);

  const timeline = useMemo(() => buildTimeline(data, side, now), [data, side, now]);
  const receiptFor = useMemo(() => lastOwnMessage(data, side), [data, side]);
  const oldest = data.messages.find((message) => !message.localId);
  const oldestId = oldest?.id;
  const last = data.messages[data.messages.length - 1];
  const isEmpty = data.messages.length === 0 && data.notices.length === 0;

  const scrollToBottom = useCallback((behavior: ScrollBehavior) => {
    const container = containerRef.current;
    if (container) container.scrollTo({ top: container.scrollHeight, behavior });
  }, []);

  // Opens at the newest message.
  useLayoutEffect(() => {
    scrollToBottom('instant');
    readyRef.current = true;
  }, [scrollToBottom]);

  // A message was appended: follow it when it is ours or the reader is at the bottom, else count it.
  const previousRef = useRef(data.messages);
  useLayoutEffect(() => {
    const previous = previousRef.current;
    previousRef.current = data.messages;
    const previousLast = previous[previous.length - 1];
    if (!last || previousLast?.id === last.id) return;
    // Our optimistic row was replaced by its server copy: the same message, not a new one.
    const replaced =
      previousLast?.localId !== undefined &&
      previousLast.senderRole === last.senderRole &&
      previousLast.body === last.body &&
      previousLast.imageFileId === last.imageFileId;
    if (replaced) return;

    if (last.senderRole === side) {
      stickRef.current = true;
      scrollToBottom('smooth');
    } else if (stickRef.current) {
      scrollToBottom('smooth');
    } else {
      setUnseen((count) => count + 1);
    }
  }, [data.messages, last, side, scrollToBottom]);

  // Older messages were prepended: keep the message the reader was looking at where it was.
  const previousOldestRef = useRef(oldestId);
  useLayoutEffect(() => {
    if (oldestId === previousOldestRef.current) return;
    previousOldestRef.current = oldestId;
    const container = containerRef.current;
    const anchor = anchorRef.current;
    anchorRef.current = null;
    if (container && anchor) {
      container.scrollTop = container.scrollHeight - anchor.height + anchor.top;
    }
  }, [oldestId]);

  const requestOlder = useCallback(() => {
    const container = containerRef.current;
    if (!container || !readyRef.current || !data.hasMore || loadingOlder || !oldestId) return;
    anchorRef.current = { height: container.scrollHeight, top: container.scrollTop };
    onLoadOlder(oldestId);
  }, [data.hasMore, loadingOlder, oldestId, onLoadOlder]);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    const root = containerRef.current;
    if (!sentinel || !root) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) requestOlder();
      },
      { root, rootMargin: LOAD_AHEAD },
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [requestOlder]);

  // Content grew (a picture loaded, text reflowed) while the reader is at the bottom: stay there.
  useEffect(() => {
    const content = contentRef.current;
    const container = containerRef.current;
    if (!content || !container) return;
    const observer = new ResizeObserver(() => {
      if (stickRef.current) container.scrollTop = container.scrollHeight;
    });
    observer.observe(content);
    return () => observer.disconnect();
  }, []);

  const handleScroll = () => {
    const container = containerRef.current;
    if (!container) return;
    const near =
      container.scrollHeight - container.scrollTop - container.clientHeight < NEAR_BOTTOM_PX;
    stickRef.current = near;
    if (near) setUnseen((count) => (count === 0 ? count : 0));
    if (anchorRef.current) {
      anchorRef.current = { height: container.scrollHeight, top: container.scrollTop };
    }
  };

  const jumpToNew = () => {
    stickRef.current = true;
    setUnseen(0);
    scrollToBottom('smooth');
  };

  const actions = useMemo<MessageListActions>(
    () => ({
      onImageLoad: (image) => {
        const container = containerRef.current;
        if (!container) return;
        if (stickRef.current) {
          container.scrollTop = container.scrollHeight;
          return;
        }
        // Loaded above what is on screen: shift by its height so the view does not jump.
        const rect = image.getBoundingClientRect();
        if (rect.bottom <= container.getBoundingClientRect().top) {
          container.scrollTop += rect.height;
        }
      },
      openImage: setLightbox,
      retrySend: onRetry,
      discardSend: onDiscard,
    }),
    [onRetry, onDiscard],
  );

  return (
    <MessageListContext.Provider value={actions}>
      <div className="relative min-h-0 flex-1">
        <div
          ref={containerRef}
          onScroll={handleScroll}
          role="log"
          aria-live="polite"
          aria-relevant="additions"
          aria-label={copy.log}
          className="h-full overflow-y-auto overscroll-contain [overflow-anchor:none]"
        >
          <div
            ref={contentRef}
            className="flex min-h-full flex-col justify-end gap-3 px-3 py-4 md:px-4"
          >
            <div ref={sentinelRef} aria-hidden />

            {loadingOlder ? (
              <div
                role="status"
                className="text-body-xs text-muted-foreground flex items-center justify-center gap-2 py-1"
              >
                <Loader2 className="size-4 animate-spin" aria-hidden />
                {copy.loadingOlder}
              </div>
            ) : olderError && data.hasMore ? (
              <div className="flex justify-center py-1">
                <button
                  type="button"
                  onClick={requestOlder}
                  className="text-body-xs text-input-error-text underline underline-offset-2"
                >
                  {copy.olderError}. {copy.retry}
                </button>
              </div>
            ) : null}

            {isEmpty ? (
              <div className="flex flex-1 flex-col items-center justify-center gap-3 px-4 py-10 text-center">
                <span className="bg-primary/15 text-primary flex size-14 items-center justify-center rounded-full">
                  <MessageCircle className="size-7" aria-hidden />
                </span>
                <p className="text-body-lg text-foreground font-semibold">{empty.title}</p>
                <p className="text-body-sm text-muted-foreground max-w-sm">{empty.description}</p>
              </div>
            ) : null}

            {timeline.map((day) => (
              <section key={day.key} aria-label={day.label} className="flex flex-col gap-3">
                <DaySeparator label={day.label} />
                {day.items.map((item) =>
                  item.kind === 'notice' ? (
                    <NoticeRow key={item.key} notice={item.notice} />
                  ) : (
                    <MessageGroup
                      key={item.key}
                      group={item}
                      side={side}
                      student={data.conversation.student}
                      meId={meId}
                      receipt={
                        receiptFor && item.messages.some((message) => message.id === receiptFor.id)
                          ? receiptFor
                          : undefined
                      }
                    />
                  ),
                )}
              </section>
            ))}
          </div>
        </div>

        {unseen > 0 ? (
          <button
            type="button"
            onClick={jumpToNew}
            className={cn(
              'bg-primary text-primary-foreground text-body-sm hover:bg-primary-hover absolute bottom-3 left-1/2 flex -translate-x-1/2 items-center gap-1.5 rounded-full px-4 py-2 font-semibold shadow-lg transition-colors',
            )}
          >
            {copy.newMessages}
            <ArrowDown className="size-4" aria-hidden />
          </button>
        ) : null}
      </div>

      <ImageLightbox fileId={lightbox} onClose={() => setLightbox(null)} />
    </MessageListContext.Provider>
  );
}
