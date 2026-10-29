import type { ComponentProps, ReactNode } from 'react';

import { cn } from '@/lib/utils';

/** Label + control + hint stacked with the spacing used by every admin form. */
export function Field({ className, ...props }: ComponentProps<'div'>) {
  return <div className={cn('flex flex-col gap-1.5', className)} {...props} />;
}

export function FieldHint({ id, children }: { id?: string; children: ReactNode }) {
  return (
    <p id={id} className="text-body-xs text-muted-foreground">
      {children}
    </p>
  );
}

export function FieldError({ id, children }: { id?: string; children: ReactNode }) {
  return (
    <p id={id} role="alert" className="text-body-xs text-input-error-text">
      {children}
    </p>
  );
}
