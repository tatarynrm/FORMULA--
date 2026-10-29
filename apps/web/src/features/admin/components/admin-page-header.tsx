import { ChevronLeft } from 'lucide-react';
import Link from 'next/link';
import type { ReactNode } from 'react';

import { t } from '@/locales';

interface AdminPageHeaderProps {
  title: ReactNode;
  /** Shows a back arrow that links here. */
  backHref?: string;
  /** Right-aligned controls, usually the "Додати ..." button. */
  actions?: ReactNode;
}

/** Title row of the admin pages (Figma "page-title"): optional back arrow, title, action buttons. */
export function AdminPageHeader({ title, backHref, actions }: AdminPageHeaderProps) {
  return (
    <header className="flex flex-wrap items-center justify-between gap-4">
      <div className="flex min-w-0 items-center gap-3">
        {backHref ? (
          <Link
            href={backHref}
            aria-label={t.admin.row.back}
            className="text-foreground hover:text-primary shrink-0 transition-colors"
          >
            <ChevronLeft className="size-7" />
          </Link>
        ) : null}
        {typeof title === 'string' ? (
          <h1 className="text-title text-foreground min-w-0 truncate">{title}</h1>
        ) : (
          title
        )}
      </div>
      {actions ? <div className="flex items-center gap-3">{actions}</div> : null}
    </header>
  );
}
