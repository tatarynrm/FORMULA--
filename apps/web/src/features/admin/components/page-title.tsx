import { SquarePen } from 'lucide-react';
import type { ReactNode } from 'react';

import { t } from '@/locales';

interface PageTitleProps {
  children: ReactNode;
  /** Shows the pencil that opens the rename dialog. */
  onEdit?: () => void;
  /** Accessible name of the pencil, e.g. "Редагувати предмет". */
  editLabel?: string;
}

/**
 * The page `<h1>` of an editor, with the edit pencil from the design next to it. Long names wrap
 * instead of being cut, because the admin needs to read the full name here.
 */
export function PageTitle({ children, onEdit, editLabel = t.admin.row.edit }: PageTitleProps) {
  return (
    <div className="flex min-w-0 items-center gap-3">
      <h1 className="text-title text-foreground min-w-0 wrap-anywhere">{children}</h1>
      {onEdit ? (
        <button
          type="button"
          aria-label={editLabel}
          title={editLabel}
          onClick={onEdit}
          className="text-muted-foreground hover:text-foreground shrink-0 transition-colors"
        >
          <SquarePen className="size-6" />
        </button>
      ) : null}
    </div>
  );
}
