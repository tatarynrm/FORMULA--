'use client';

import { GripVertical } from 'lucide-react';

import { format } from '@/lib/format';
import { cn } from '@/lib/utils';
import { t } from '@/locales';

import { useSortableItem } from './sortable-item-context';

interface DragHandleProps {
  /** Name of the item, when it differs from the one the list got from `getLabel`. */
  label?: string;
  className?: string;
}

const LOOK =
  'text-muted-foreground flex size-8 shrink-0 items-center justify-center rounded-lg transition-colors';

/**
 * The grip that starts a drag: it is the ONLY place that reacts to the pointer, so links, buttons
 * and text inside a row keep working. A real button, so the keyboard can pick it up too (Space,
 * arrows, Space, or Esc). Outside a sortable item (inside the lifted copy) it is only a picture;
 * in a list of one item it is not shown at all.
 */
export function DragHandle({ label, className }: DragHandleProps) {
  const item = useSortableItem();

  if (!item) {
    return (
      <span aria-hidden className={cn(LOOK, className)}>
        <GripVertical className="size-5" />
      </span>
    );
  }

  const { label: itemLabel, attributes, listeners, setActivator, disabled, canReorder } = item;

  // A list of one item has nothing to reorder, so it shows no grip.
  if (!canReorder) return null;

  const name = format(t.adminContent.sortable.handleLabel, { title: label ?? itemLabel });

  return (
    <button
      type="button"
      ref={setActivator}
      {...attributes}
      {...listeners}
      aria-label={name}
      title={name}
      className={cn(
        LOOK,
        // `touch-none` keeps the page from scrolling while a finger drags the grip.
        'hover:bg-accent hover:text-foreground focus-visible:ring-ring cursor-grab touch-none outline-none focus-visible:ring-3 active:cursor-grabbing',
        disabled && 'cursor-not-allowed opacity-50',
        className,
      )}
    >
      <GripVertical className="size-5" aria-hidden />
    </button>
  );
}
