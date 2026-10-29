'use client';

import { Tabs } from 'radix-ui';
import type { ReactNode } from 'react';

import { cn } from '@/lib/utils';

export interface PillTabItem<T extends string> {
  id: T;
  label: string;
  /** Small counter after the label. */
  count?: number;
}

interface PillTabsProps<T extends string> {
  value: T;
  onValueChange: (value: T) => void;
  items: readonly PillTabItem<T>[];
  /** Accessible name of the tab list. */
  label: string;
  children: ReactNode;
  className?: string;
}

/**
 * Pill tab bar (Figma "tab-bar-container") with full tab semantics: arrow keys move between tabs and
 * every tab is linked to its panel. Use `PillTabPanel` for the panels.
 */
export function PillTabs<T extends string>({
  value,
  onValueChange,
  items,
  label,
  children,
  className,
}: PillTabsProps<T>) {
  return (
    <Tabs.Root
      value={value}
      onValueChange={(next) => onValueChange(next as T)}
      className={cn('flex flex-col gap-6', className)}
    >
      <Tabs.List
        aria-label={label}
        className="bg-background flex h-13 w-full scrollbar-none gap-1 overflow-x-auto rounded-full p-1.5"
      >
        {items.map((item) => (
          <Tabs.Trigger
            key={item.id}
            value={item.id}
            className="text-body-md text-muted-foreground hover:text-foreground data-[state=active]:bg-card data-[state=active]:text-primary focus-visible:ring-ring flex min-w-fit flex-1 items-center justify-center gap-2 rounded-full px-5 py-2.5 font-medium whitespace-nowrap transition-colors outline-none focus-visible:ring-[3px]"
          >
            {item.label}
            {item.count !== undefined ? (
              <span className="text-body-xs bg-surface-raised text-text-secondary rounded-full px-2 py-0.5">
                {item.count}
              </span>
            ) : null}
          </Tabs.Trigger>
        ))}
      </Tabs.List>
      {children}
    </Tabs.Root>
  );
}

export function PillTabPanel({
  value,
  children,
  className,
}: {
  value: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <Tabs.Content
      value={value}
      className={cn(
        'focus-visible:ring-ring rounded-2xl outline-none focus-visible:ring-[3px]',
        className,
      )}
    >
      {children}
    </Tabs.Content>
  );
}
