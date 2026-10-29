import { ChevronRight } from 'lucide-react';
import Link from 'next/link';

import { t } from '@/locales';

export interface BreadcrumbItem {
  label: string;
  /** Items without a link are plain text; the last one is the current page. */
  href?: string;
}

/** "Головна > Біохімія > Гормони > Стероїдні гормони". */
export function Breadcrumbs({ items }: { items: readonly BreadcrumbItem[] }) {
  return (
    <nav aria-label={t.learning.common.breadcrumbLabel}>
      <ol className="text-body-sm text-muted-foreground flex flex-wrap items-center gap-x-1 gap-y-0.5">
        {items.map((item, index) => {
          const isLast = index === items.length - 1;

          return (
            <li key={`${index}-${item.label}`} className="flex min-w-0 items-center gap-1">
              {index > 0 ? <ChevronRight className="size-4 shrink-0" aria-hidden /> : null}
              {item.href && !isLast ? (
                <Link
                  href={item.href}
                  className="hover:text-foreground truncate underline-offset-4 transition-colors hover:underline"
                >
                  {item.label}
                </Link>
              ) : (
                <span
                  aria-current={isLast ? 'page' : undefined}
                  className={isLast ? 'text-foreground truncate font-medium' : 'truncate'}
                >
                  {item.label}
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
