import type { ReactNode } from 'react';

import { cn } from '@/lib/utils';

interface EmptyStateProps {
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}

/** Placeholder block for pages whose content is not built yet. */
export function EmptyState({ title, description, action, className }: EmptyStateProps) {
  return (
    <div
      className={cn(
        'border-border bg-surface-raised rounded-base flex flex-col items-center gap-3 border border-dashed px-6 py-16 text-center',
        className,
      )}
    >
      <h2 className="text-h3 text-foreground">{title}</h2>
      {description ? (
        <p className="text-body-md text-muted-foreground max-w-md">{description}</p>
      ) : null}
      {action}
    </div>
  );
}
