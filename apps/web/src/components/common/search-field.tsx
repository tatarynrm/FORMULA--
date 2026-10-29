import type { ComponentProps } from 'react';

import { cn } from '@/lib/utils';

import { MaskIcon } from './mask-icon';

/** Pill search input with a leading icon (Figma "search-bar"). */
export function SearchField({ className, ...props }: Omit<ComponentProps<'input'>, 'type'>) {
  return (
    <label
      className={cn(
        'bg-surface-raised border-input focus-within:border-ring focus-within:ring-ring/50 flex h-13 w-full items-center gap-3 rounded-full border-[1.5px] px-5 transition-shadow focus-within:ring-[3px]',
        className,
      )}
    >
      <MaskIcon src="/cabinet/icon-search.svg" className="text-muted-foreground size-6" />
      <input
        type="search"
        className="text-body-md text-foreground placeholder:text-muted-foreground min-w-0 flex-1 bg-transparent outline-none"
        {...props}
      />
    </label>
  );
}
