'use client';

import { ChevronDown, ChevronUp, Plus, SquarePen } from 'lucide-react';
import Link from 'next/link';
import { type ReactNode, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { cn } from '@/lib/utils';
import { t } from '@/locales';

import type { ContentStatus } from '../types';
import { RowActions, type RowAction } from './row-actions';
import { StatusBadge } from './status-badge';

interface ContentRowProps {
  title: string;
  /** Makes the title a link to the editor of this item. */
  href?: string;
  status?: ContentStatus;
  /** Line under the title: counters, free / paid pill, test kind. */
  meta?: ReactNode;
  /** Shows the pencil next to the title; it opens the rename dialog. */
  onRename?: () => void;
  /** The drag grip (`<DragHandle />`) at the start of the row, when the row can be reordered. */
  handle?: ReactNode;
  /** Shows the "+" button (add a nested item). */
  onAdd?: () => void;
  /** Accessible name of the "+" button, e.g. "Додати підтему". */
  addLabel?: string;
  /** Items of the kebab menu; the menu is hidden when there are none. */
  actions?: RowAction[];
  /** Nested rows; makes the row expandable. */
  children?: ReactNode;
  /** Nested rows are drawn smaller and indented. */
  nested?: boolean;
  /** Whether the nested rows are shown at first; the lifted copy of a dragged row starts closed. */
  defaultOpen?: boolean;
}

/**
 * One row of an admin list (topic, subtopic, base, booklet, AMPS test): title with an edit icon,
 * status pill, optional "+", expand toggle and the kebab menu. Matches the Figma "course-card" rows.
 */
export function ContentRow({
  title,
  href,
  status,
  meta,
  onRename,
  handle,
  onAdd,
  addLabel,
  actions,
  children,
  nested = false,
  defaultOpen = true,
}: ContentRowProps) {
  const [open, setOpen] = useState(defaultOpen);
  const expandable = children !== undefined && children !== null && children !== false;
  const { edit, add, expand, collapse } = t.admin.row;

  const card = (
    <article
      className={cn(
        'bg-surface-raised border-input flex flex-wrap items-center justify-between gap-x-4 gap-y-3 border',
        nested ? 'rounded-2xl px-4 py-3 md:px-6 md:py-4' : 'rounded-3xl px-4 py-4 md:px-6 md:py-5',
      )}
    >
      <div className="flex min-w-0 flex-1 basis-56 items-center gap-2">
        {handle}
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <div className="flex min-w-0 items-center gap-3">
            <h3 className="text-body-lg text-foreground min-w-0 font-semibold wrap-anywhere">
              {href ? (
                <Link href={href} className="hover:text-primary transition-colors">
                  {title}
                </Link>
              ) : (
                title
              )}
            </h3>
            {onRename ? (
              <button
                type="button"
                aria-label={`${edit}: ${title}`}
                onClick={onRename}
                className="text-muted-foreground hover:text-foreground shrink-0 transition-colors"
              >
                <SquarePen className="size-5" />
              </button>
            ) : null}
          </div>
          {meta ? (
            <div className="text-body-sm text-muted-foreground flex flex-wrap items-center gap-x-4 gap-y-1">
              {meta}
            </div>
          ) : null}
        </div>
      </div>

      <div className="ml-auto flex shrink-0 items-center gap-2 md:gap-4">
        {status ? <StatusBadge status={status} /> : null}
        {onAdd ? (
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label={addLabel ?? add}
            title={addLabel ?? add}
            onClick={onAdd}
            className="text-text-secondary"
          >
            <Plus />
          </Button>
        ) : null}
        {expandable ? (
          <CollapsibleTrigger asChild>
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label={open ? collapse : expand}
              className="text-text-secondary"
            >
              {open ? <ChevronUp /> : <ChevronDown />}
            </Button>
          </CollapsibleTrigger>
        ) : null}
        {actions && actions.length > 0 ? <RowActions actions={actions} /> : null}
      </div>
    </article>
  );

  if (!expandable) return card;

  return (
    <Collapsible open={open} onOpenChange={setOpen} className="flex flex-col gap-2">
      {card}
      <CollapsibleContent>
        <div className="border-border ml-4 flex flex-col gap-2 border-l-2 pl-4 md:ml-6">
          {children}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}
