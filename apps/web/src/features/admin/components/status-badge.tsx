import { cn } from '@/lib/utils';
import { t } from '@/locales';

import type { ContentStatus } from '../types';

const STYLES: Record<ContentStatus, string> = {
  published: 'border-success bg-success-soft text-success',
  draft: 'border-transparent bg-muted text-foreground',
};

/** "Опубліковано" (green outline) or "Чернетка" (grey) pill. */
export function StatusBadge({ status, className }: { status: ContentStatus; className?: string }) {
  return (
    <span
      className={cn(
        'text-body-sm inline-flex items-center rounded-full border px-4 py-1.5 font-medium whitespace-nowrap',
        STYLES[status],
        className,
      )}
    >
      {t.admin.status[status]}
    </span>
  );
}
