import type { ReactNode } from 'react';

import { cn } from '@/lib/utils';

interface PageHeaderProps {
  title: string;
  description?: string;
  /** Right-aligned control on desktop, usually a `SearchField`. */
  action?: ReactNode;
  className?: string;
}

/** Title row used at the top of cabinet and admin pages (Figma "title-bar"). */
export function PageHeader({ title, description, action, className }: PageHeaderProps) {
  return (
    <header
      className={cn(
        'flex flex-col gap-4 md:flex-row md:items-center md:justify-between',
        className,
      )}
    >
      <div className="flex flex-col gap-1">
        <h1 className="text-title text-foreground">{title}</h1>
        {description ? <p className="text-body-md text-muted-foreground">{description}</p> : null}
      </div>
      {action ? <div className="w-full md:max-w-157">{action}</div> : null}
    </header>
  );
}
