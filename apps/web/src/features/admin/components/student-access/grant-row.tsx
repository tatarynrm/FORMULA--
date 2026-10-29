import { Trash2 } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { format } from '@/lib/format';
import { t } from '@/locales';

import { formatDate } from '../../utils/format-date';

interface GrantRowProps {
  title: string;
  /** Second line: where the subtopic sits, or what the subject grant covers. */
  subtitle: string;
  source: 'manual' | 'payment';
  /** ISO date the access was given. */
  createdAt: string;
  /** Accessible name of the revoke button, which names the thing it takes away. */
  revokeLabel: string;
  onRevoke: () => void;
}

/** One access a student has (a whole subject or one subtopic) with the button that takes it away. */
export function GrantRow({
  title,
  subtitle,
  source,
  createdAt,
  revokeLabel,
  onRevoke,
}: GrantRowProps) {
  const copy = t.adminContent.access;

  return (
    <li className="bg-surface-raised border-input flex items-center justify-between gap-3 rounded-2xl border p-3">
      <div className="flex min-w-0 flex-col gap-1">
        <p className="text-body-md text-foreground font-semibold wrap-anywhere">{title}</p>
        <p className="text-body-xs text-muted-foreground wrap-anywhere">{subtitle}</p>
        <div className="text-body-xs text-text-secondary flex flex-wrap items-center gap-2">
          <Badge variant="secondary">{copy.sources[source]}</Badge>
          <span>{format(copy.since, { date: formatDate(createdAt) })}</span>
        </div>
      </div>
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        aria-label={revokeLabel}
        title={revokeLabel}
        onClick={onRevoke}
      >
        <Trash2 />
      </Button>
    </li>
  );
}
