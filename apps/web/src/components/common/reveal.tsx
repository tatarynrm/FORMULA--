'use client';

import { type CSSProperties, type ElementType, type ReactNode } from 'react';

import { useInView } from '@/hooks/use-in-view';
import { cn } from '@/lib/utils';

interface RevealProps {
  children: ReactNode;
  className?: string;
  /** Delay in ms before the block animates in (single-block mode). */
  delay?: number;
  /** Animate the direct children one after another instead of the block itself. */
  group?: boolean;
  as?: ElementType;
}

/**
 * Fades and lifts its content in when it scrolls into view. The animation itself lives in
 * globals.css (`.reveal`, `[data-reveal-group]`), so it is skipped for visitors who prefer
 * reduced motion and the content stays visible when scripting is off.
 */
export function Reveal({
  children,
  className,
  delay = 0,
  group = false,
  as: Tag = 'div',
}: RevealProps) {
  const [ref, inView] = useInView<HTMLElement>();
  const style = delay ? ({ '--reveal-delay': `${delay}ms` } as CSSProperties) : undefined;

  return (
    <Tag
      ref={ref}
      data-visible={inView}
      {...(group ? { 'data-reveal-group': '' } : {})}
      style={style}
      className={cn(!group && 'reveal', className)}
    >
      {children}
    </Tag>
  );
}
