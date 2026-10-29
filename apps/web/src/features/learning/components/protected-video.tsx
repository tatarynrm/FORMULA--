'use client';

import { useRef, useState } from 'react';

import { fileUrl } from '@/lib/files';
import { cn } from '@/lib/utils';
import { t } from '@/locales';

import { ensureFreshSession } from '../utils/session';

interface ProtectedVideoProps {
  /** Id of an uploaded video. The api streams it with Range requests, so seeking works. */
  fileId: string;
  /** Accessible name of the player. */
  title: string;
  className?: string;
}

/**
 * The video file itself in a native player. A long lesson can outlive the session cookie the browser
 * uses to fetch the next part: when playback fails, the session is renewed and the video is loaded
 * again from the same moment.
 */
export function ProtectedVideo({ fileId, title, className }: ProtectedVideoProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const resumeRef = useRef<{ time: number; play: boolean } | null>(null);
  const [retried, setRetried] = useState(false);
  const base = fileUrl(fileId);

  async function handleError() {
    const video = videoRef.current;
    if (retried || !video) return;

    resumeRef.current = { time: video.currentTime, play: !video.paused };
    await ensureFreshSession();
    setRetried(true);
  }

  function handleLoadedMetadata() {
    const video = videoRef.current;
    const resume = resumeRef.current;
    if (!video || !resume) return;

    resumeRef.current = null;
    video.currentTime = resume.time;
    if (resume.play) void video.play().catch(() => undefined);
  }

  return (
    <video
      ref={videoRef}
      src={retried ? `${base}?retry=1` : base}
      controls
      playsInline
      preload="metadata"
      aria-label={title}
      onError={() => void handleError()}
      onLoadedMetadata={handleLoadedMetadata}
      className={cn('bg-foreground aspect-video w-full rounded-2xl', className)}
    >
      {t.learning.subtopic.materials.videoFallback}
    </video>
  );
}
