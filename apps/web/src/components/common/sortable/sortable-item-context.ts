'use client';

import type { DraggableAttributes, DraggableSyntheticListeners } from '@dnd-kit/core';
import { createContext, useContext } from 'react';

/** What a `DragHandle` needs from the sortable item it sits in. */
export interface SortableItemContextValue {
  /** Name of the item: it names the handle for screen readers. */
  label: string;
  attributes: DraggableAttributes;
  listeners: DraggableSyntheticListeners;
  setActivator: (element: HTMLElement | null) => void;
  /** The list is locked (for example while the new order is being saved). */
  disabled: boolean;
  /** The list has more than one item; with a single item there is nothing to reorder. */
  canReorder: boolean;
}

export const SortableItemContext = createContext<SortableItemContextValue | null>(null);

/** The sortable item around the caller, or `null` outside of one (in the copy that follows the pointer). */
export function useSortableItem(): SortableItemContextValue | null {
  return useContext(SortableItemContext);
}
