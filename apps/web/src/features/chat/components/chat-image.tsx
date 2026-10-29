'use client';

import { useState } from 'react';

import { refreshSession } from '@/lib/api-client';
import { fileUrl } from '@/lib/files';
import { cn } from '@/lib/utils';
import { t } from '@/locales';

interface ChatImageProps {
  fileId: string;
  alt: string;
  className?: string;
  /** Called once the picture has its size (the list keeps its scroll position in place). */
  onLoad?: (image: HTMLImageElement) => void;
}

/**
 * A picture sent in the chat. The browser fetches it with the session cookie, which may have
 * expired while the page stayed open: on a failed load the session is renewed and the picture is
 * requested once more before an error tile is shown. A plain `<img>` is used on purpose: the
 * Next.js image optimizer fetches remote files without cookies.
 */
export function ChatImage({ fileId, alt, className, onLoad }: ChatImageProps) {
  const [retried, setRetried] = useState(false);
  const [failed, setFailed] = useState(false);
  const base = fileUrl(fileId);

  async function handleError() {
    if (retried) {
      setFailed(true);
      return;
    }
    await refreshSession();
    setRetried(true);
  }

  if (failed) {
    return (
      <div
        role="img"
        aria-label={alt}
        className={cn(
          'bg-surface-soft text-body-sm text-muted-foreground flex min-h-24 min-w-40 items-center justify-center rounded-xl p-4 text-center',
          className,
        )}
      >
        {t.chat.thread.imageError}
      </div>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element -- the file needs the session cookie, see above
    <img
      src={retried ? `${base}?retry=1` : base}
      alt={alt}
      decoding="async"
      onError={() => void handleError()}
      onLoad={(event) => onLoad?.(event.currentTarget)}
      className={cn('h-auto w-auto max-w-full object-contain', className)}
    />
  );
}
