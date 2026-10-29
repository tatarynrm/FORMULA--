'use client';

import { useState } from 'react';

import { fileUrl } from '@/lib/files';
import { cn } from '@/lib/utils';
import { t } from '@/locales';

import { ensureFreshSession } from '../utils/session';

interface ProtectedImageProps {
  /** Id of an uploaded image. */
  fileId: string;
  /** Always give a meaningful description (question and option pictures carry content). */
  alt: string;
  className?: string;
}

/**
 * A picture from the file storage. The browser fetches it with the session cookie, which may have
 * expired while the page stayed open: on a failed load the session is renewed and the picture is
 * requested once more before an error tile is shown.
 */
export function ProtectedImage({ fileId, alt, className }: ProtectedImageProps) {
  const [retried, setRetried] = useState(false);
  const [failed, setFailed] = useState(false);
  const base = fileUrl(fileId);

  async function handleError() {
    if (retried) {
      setFailed(true);
      return;
    }
    await ensureFreshSession();
    setRetried(true);
  }

  if (failed) {
    return (
      <div
        role="img"
        aria-label={alt}
        className={cn(
          'bg-surface-soft text-body-sm text-muted-foreground flex min-h-24 items-center justify-center rounded-2xl p-4 text-center',
          className,
        )}
      >
        {t.learning.subtopic.materials.imageError}
      </div>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element -- the file needs the session cookie, which the Next.js image optimizer does not send
    <img
      src={retried ? `${base}?retry=1` : base}
      alt={alt}
      loading="lazy"
      decoding="async"
      onError={() => void handleError()}
      // `self-start`: inside a flex column the picture must keep its own width, not stretch to the card.
      className={cn('h-auto w-auto max-w-full self-start object-contain', className)}
    />
  );
}
