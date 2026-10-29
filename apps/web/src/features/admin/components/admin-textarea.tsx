import type { ComponentProps } from 'react';

import { cn } from '@/lib/utils';

/**
 * Multi-line field styled like `Input` (white surface, light border, pink focus ring). The shared
 * shadcn `Textarea` is not adjusted to the Figma inputs, so the admin forms use this one. It grows
 * with its content in browsers that support `field-sizing`.
 */
export function AdminTextarea({ className, ...props }: ComponentProps<'textarea'>) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        'border-input bg-surface-raised text-body-md text-foreground placeholder:text-input-placeholder field-sizing-content min-h-24 w-full resize-y rounded-2xl border px-4 py-3 transition-colors outline-none',
        'focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]',
        'aria-invalid:border-input-error-border aria-invalid:bg-input-error-bg',
        'disabled:border-input-disabled-border disabled:bg-input-disabled-bg disabled:text-input-disabled-text disabled:cursor-not-allowed',
        className,
      )}
      {...props}
    />
  );
}
