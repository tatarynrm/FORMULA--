import type { ReactNode } from 'react';

import { cn } from '@/lib/utils';

interface SectionCardProps {
  /** Anchor, so a hint can scroll to this section. */
  id?: string;
  /** `-1` lets a hint move the keyboard focus here after scrolling. */
  tabIndex?: number;
  title: string;
  description?: string;
  /** Right-aligned controls of the section header (buttons, status). */
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
}

/** White rounded block with a heading: one section of an editor page (description, materials, tests...). */
export function SectionCard({
  id,
  tabIndex,
  title,
  description,
  actions,
  children,
  className,
}: SectionCardProps) {
  return (
    <section
      id={id}
      tabIndex={tabIndex}
      className={cn(
        'bg-surface-raised border-input flex flex-col gap-4 rounded-3xl border p-4 outline-none md:p-6',
        className,
      )}
    >
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex min-w-0 flex-col gap-1">
          <h2 className="text-h3 text-foreground">{title}</h2>
          {description ? <p className="text-body-sm text-text-secondary">{description}</p> : null}
        </div>
        {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
      </header>
      {children}
    </section>
  );
}
