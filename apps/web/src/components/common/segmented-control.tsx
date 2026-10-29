'use client';

import { cn } from '@/lib/utils';

interface SegmentedControlProps<T extends string> {
  items: readonly { id: T; label: string }[];
  value: T;
  onValueChange: (value: T) => void;
  label: string;
  className?: string;
}

/** Pill tab bar (Figma "tab-bar-container"): the active tab is a raised surface with pink text. */
export function SegmentedControl<T extends string>({
  items,
  value,
  onValueChange,
  label,
  className,
}: SegmentedControlProps<T>) {
  return (
    <div
      role="tablist"
      aria-label={label}
      className={cn('bg-background flex h-13 w-full gap-1 rounded-full p-1.5', className)}
    >
      {items.map((item) => (
        <button
          key={item.id}
          type="button"
          role="tab"
          aria-selected={item.id === value}
          onClick={() => onValueChange(item.id)}
          className={cn(
            'text-body-md flex flex-1 items-center justify-center rounded-full px-5 py-2.5 font-medium transition-colors',
            item.id === value
              ? 'bg-card text-primary'
              : 'text-muted-foreground hover:text-foreground',
          )}
        >
          {item.label}
        </button>
      ))}
    </div>
  );
}
