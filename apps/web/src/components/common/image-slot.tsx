import { cn } from '@/lib/utils';

interface ImageSlotProps {
  className?: string;
  /** Accessible label describing the image that will be placed here. */
  label?: string;
}

/** Empty frame that reserves space for a photo (the Figma design shows these as flat blocks). */
export function ImageSlot({ className, label }: ImageSlotProps) {
  return (
    <div
      role="img"
      aria-label={label}
      className={cn('bg-surface-soft aspect-square w-full rounded-3xl', className)}
    />
  );
}
