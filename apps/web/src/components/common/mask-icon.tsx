import { cn } from '@/lib/utils';

interface MaskIconProps {
  /** Public path of a Figma SVG, e.g. `/cabinet/icon-home.svg`. */
  src: string;
  className?: string;
}

/**
 * Renders a Figma SVG as a mask filled with `currentColor`, so one asset can be tinted by
 * text classes (`text-primary`, `text-muted-foreground`) for active, hover and disabled states.
 */
export function MaskIcon({ src, className }: MaskIconProps) {
  const mask = `url(${src}) center / contain no-repeat`;

  return (
    <span
      aria-hidden
      className={cn('inline-block size-5 shrink-0 bg-current', className)}
      style={{ mask, WebkitMask: mask }}
    />
  );
}
