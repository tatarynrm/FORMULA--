'use client';

import Image from 'next/image';
import { type ReactNode, useCallback, useEffect, useRef, useState } from 'react';

import { cn } from '@/lib/utils';
import { t } from '@/locales';

interface ScrollCarouselProps {
  title: string;
  /** Tailwind classes that size one slide, e.g. `auto-cols-[85%] lg:auto-cols-[calc((100%-3rem)/3)]`. */
  columnsClassName: string;
  children: ReactNode;
  className?: string;
}

/** Section heading with prev/next arrows and a scroll-snapping horizontal track. */
export function ScrollCarousel({
  title,
  columnsClassName,
  children,
  className,
}: ScrollCarouselProps) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [canPrev, setCanPrev] = useState(false);
  const [canNext, setCanNext] = useState(true);

  const update = useCallback(() => {
    const track = trackRef.current;
    if (!track) return;
    setCanPrev(track.scrollLeft > 1);
    setCanNext(track.scrollLeft + track.clientWidth < track.scrollWidth - 1);
  }, []);

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;
    update();
    track.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update);
    return () => {
      track.removeEventListener('scroll', update);
      window.removeEventListener('resize', update);
    };
  }, [update]);

  function scrollByOne(direction: 1 | -1) {
    const track = trackRef.current;
    const first = track?.firstElementChild;
    if (!track || !(first instanceof HTMLElement)) return;
    const gap = Number.parseFloat(getComputedStyle(track).columnGap) || 0;
    track.scrollBy({ left: direction * (first.offsetWidth + gap), behavior: 'smooth' });
  }

  return (
    <div className={cn('flex flex-col gap-10', className)}>
      <div className="flex items-center justify-between gap-4">
        <h2 className="text-h2 text-foreground">{title}</h2>
        <div className="flex gap-2">
          <ArrowButton direction="prev" disabled={!canPrev} onClick={() => scrollByOne(-1)} />
          <ArrowButton direction="next" disabled={!canNext} onClick={() => scrollByOne(1)} />
        </div>
      </div>
      <div
        ref={trackRef}
        className={cn(
          // Vertical padding (and the matching negative margin) keeps hover lift and shadows from being clipped.
          '-my-3 grid snap-x snap-mandatory scrollbar-none grid-flow-col gap-6 overflow-x-auto py-3',
          columnsClassName,
        )}
      >
        {children}
      </div>
    </div>
  );
}

function ArrowButton({
  direction,
  disabled,
  onClick,
}: {
  direction: 'prev' | 'next';
  disabled: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={direction === 'prev' ? t.common.previous : t.common.next}
      className="bg-control-soft hover:bg-accent flex size-10 items-center justify-center rounded-full transition-colors disabled:pointer-events-none disabled:opacity-50"
    >
      <Image
        src="/landing/icon-arrow.svg"
        alt=""
        width={24}
        height={24}
        unoptimized
        className={direction === 'next' ? '-rotate-90' : 'rotate-90'}
      />
    </button>
  );
}
