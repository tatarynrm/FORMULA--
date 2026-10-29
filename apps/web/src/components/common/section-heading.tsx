import type { ReactNode } from 'react';

import { cn } from '@/lib/utils';

interface SectionHeadingProps {
  title: string;
  description?: string;
  /** Optional element aligned to the right on desktop, e.g. a CTA button. */
  action?: ReactNode;
  className?: string;
}

export function SectionHeading({ title, description, action, className }: SectionHeadingProps) {
  return (
    <div
      className={cn('flex flex-col gap-4 md:flex-row md:items-end md:justify-between', className)}
    >
      <div className="flex max-w-3xl flex-col gap-2">
        <h2 className="text-h2 text-foreground">{title}</h2>
        {description ? <p className="text-body-lg text-text-secondary">{description}</p> : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}
