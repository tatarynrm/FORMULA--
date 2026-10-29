import { ChevronDown } from 'lucide-react';

import type { PolicyTocItem } from '../types';
import { PolicyTocNav } from './policy-toc-nav';

interface PolicyTocProps {
  title: string;
  navLabel: string;
  items: readonly PolicyTocItem[];
}

/**
 * Table of contents. Mobile: a native collapsible `<details>` (no JavaScript needed).
 * Desktop (lg+): a sticky card next to the content with scroll-spy highlighting.
 */
export function PolicyToc({ title, navLabel, items }: PolicyTocProps) {
  return (
    <>
      <details className="group bg-card rounded-2xl lg:hidden">
        <summary className="text-h3 text-foreground focus-visible:ring-ring flex cursor-pointer list-none items-center justify-between gap-4 rounded-2xl px-6 py-4 outline-none focus-visible:ring-2 [&::-webkit-details-marker]:hidden">
          {title}
          <ChevronDown
            aria-hidden="true"
            className="size-5 shrink-0 transition-transform group-open:rotate-180"
          />
        </summary>
        <div className="px-4 pb-4">
          <PolicyTocNav items={items} ariaLabel={navLabel} />
        </div>
      </details>

      <div className="bg-card hidden max-h-[calc(100vh-10rem)] flex-col gap-4 overflow-y-auto rounded-3xl p-6 lg:flex">
        <p className="text-body-md text-foreground font-medium uppercase">{title}</p>
        <PolicyTocNav items={items} ariaLabel={navLabel} spy />
      </div>
    </>
  );
}
