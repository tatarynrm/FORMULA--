'use client';

import { useEffect, useState } from 'react';

import { cn } from '@/lib/utils';

import type { PolicyTocItem } from '../types';

interface PolicyTocNavProps {
  items: readonly PolicyTocItem[];
  ariaLabel: string;
  /** Highlight the section that is currently being read (desktop sidebar only). */
  spy?: boolean;
}

/** Numbered list of anchor links. With `spy` it marks the section closest to the top of the screen. */
export function PolicyTocNav({ items, ariaLabel, spy = false }: PolicyTocNavProps) {
  const [activeId, setActiveId] = useState<string | null>(null);

  useEffect(() => {
    if (!spy) return;

    const visible = new Set<string>();
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) visible.add(entry.target.id);
          else visible.delete(entry.target.id);
        }
        const first = items.find((item) => visible.has(item.id));
        if (first) setActiveId(first.id);
      },
      { rootMargin: '-15% 0px -65% 0px' },
    );

    for (const item of items) {
      const element = document.getElementById(item.id);
      if (element) observer.observe(element);
    }
    return () => observer.disconnect();
  }, [items, spy]);

  return (
    <nav aria-label={ariaLabel}>
      <ol className="flex flex-col gap-1">
        {items.map((item, index) => {
          const isActive = item.id === activeId;
          return (
            <li key={item.id}>
              <a
                href={`#${item.id}`}
                aria-current={isActive ? 'location' : undefined}
                className={cn(
                  'text-body-md focus-visible:ring-ring flex gap-2 rounded-lg border-l-2 py-1.5 pr-2 pl-3 transition-colors outline-none focus-visible:ring-2',
                  isActive
                    ? 'border-primary text-foreground font-semibold'
                    : 'text-text-secondary hover:text-foreground border-transparent',
                )}
              >
                <span className="shrink-0 tabular-nums" aria-hidden="true">
                  {index + 1}.
                </span>
                <span>{item.title}</span>
              </a>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
