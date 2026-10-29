'use client';

import {
  type Announcements,
  type CollisionDescriptor,
  type CollisionDetection,
  closestCenter,
  defaultDropAnimationSideEffects,
  DndContext,
  type DragEndEvent,
  DragOverlay,
  type DropAnimation,
  type DropAnimationSideEffects,
  KeyboardSensor,
  type Modifier,
  PointerSensor,
  type PointerSensorOptions,
  TouchSensor,
  type UniqueIdentifier,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  arrayMove,
  rectSortingStrategy,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from 'react';

import { useReducedMotion } from '@/hooks/use-reduced-motion';
import { format } from '@/lib/format';
import { sortByIds } from '@/lib/sort-by-ids';
import { cn } from '@/lib/utils';
import { t } from '@/locales';

import { SortableItemContext } from './sortable-item-context';

// A drag animation in JS cannot use `var(--motion-ease)`, so these repeat the site tokens
// `--motion-ease` and `--motion-duration-sm` (see globals.css). Keep them in step.
const EASING = 'cubic-bezier(0.22, 1, 0.36, 1)';
const SHIFT_MS = 250;
const DROP_MS = 220;

/** How far the pointer must move before a press on the grip becomes a drag, so a click stays a click. */
const POINTER_DISTANCE = 4;
/** A finger must rest this long on the grip before the item lifts, so a tap or a flick across it does nothing. */
const TOUCH_DELAY_MS = 150;
const TOUCH_TOLERANCE = 6;

/**
 * The pointer sensor for a mouse or a pen. A finger is left to the touch sensor, which waits for a
 * short press: a tap, or a flick across the grip, must not pick the item up by accident.
 */
class MousePenSensor extends PointerSensor {
  static override activators: typeof PointerSensor.activators = [
    {
      eventName: 'onPointerDown',
      handler: (
        { nativeEvent: event }: ReactPointerEvent,
        { onActivation }: PointerSensorOptions,
      ) => {
        if (!event.isPrimary || event.button !== 0 || event.pointerType === 'touch') return false;
        onActivation?.({ event });
        return true;
      },
    },
  ];
}

/** The original stays hidden while the lifted copy settles into its place, then it takes over. */
const hideOriginal = defaultDropAnimationSideEffects({ styles: { active: { opacity: '0' } } });

/** Hides the original and lets the lifted copy put its shadow and scale down while it lands. */
const settle: DropAnimationSideEffects = (parameters) => {
  const restoreOriginal = hideOriginal(parameters);
  const copy = parameters.dragOverlay.node.firstElementChild;

  if (copy instanceof HTMLElement) {
    const { boxShadow, scale } = getComputedStyle(copy);
    copy.animate(
      [
        { boxShadow, scale },
        { boxShadow: 'none', scale: '1' },
      ],
      { duration: DROP_MS, easing: EASING, fill: 'forwards' },
    );
  }

  return restoreOriginal;
};

const DROP_ANIMATION: DropAnimation = { duration: DROP_MS, easing: EASING, sideEffects: settle };

/** Rows only move up and down; sideways drift of the lifted row would just look sloppy. */
const lockHorizontal: Modifier = ({ transform }) => ({ ...transform, x: 0 });
const ROW_MODIFIERS: Modifier[] = [lockHorizontal];

/**
 * Rows: the target is the row the pointer is over (or the nearest one vertically), whatever the
 * heights of the rows are. A tall row with nested rows must not need the pointer to travel to its
 * middle. Further from the list than the lifted row's own height, the pointer is not meant for this
 * list (it is over another list), so nothing is chosen and a drop there changes nothing. Without a
 * pointer (keyboard) the lifted row's own center decides.
 */
const rowUnderPointer: CollisionDetection = (args) => {
  const { pointerCoordinates, droppableContainers, droppableRects, collisionRect } = args;
  if (!pointerCoordinates) return closestCenter(args);

  const rows = droppableContainers.flatMap((container) => {
    const rect = droppableRects.get(container.id);
    return rect ? [{ container, rect }] : [];
  });
  if (rows.length === 0) return [];

  const { y } = pointerCoordinates;
  const top = Math.min(...rows.map(({ rect }) => rect.top)) - collisionRect.height;
  const bottom = Math.max(...rows.map(({ rect }) => rect.bottom)) + collisionRect.height;
  if (y < top || y > bottom) return [];

  const collisions: CollisionDescriptor[] = rows.map(({ container, rect }) => ({
    id: container.id,
    data: {
      droppableContainer: container,
      value: y < rect.top ? rect.top - y : y > rect.bottom ? y - rect.bottom : 0,
    },
  }));
  return collisions.sort((left, right) => left.data.value - right.data.value);
};

interface SortableItemProps {
  id: string;
  label: string;
  /** Shown to the user: the list is switched off. */
  disabled: boolean;
  /** No new drag can start (the list is switched off or a drop is still being saved). */
  locked: boolean;
  canReorder: boolean;
  reducedMotion: boolean;
  as: 'div' | 'li';
  children: ReactNode;
}

/** One item of the list: follows the drag (smooth displacement), and shares the grip with its content. */
function SortableItem({
  id,
  label,
  disabled,
  locked,
  canReorder,
  reducedMotion,
  as: Tag,
  children,
}: SortableItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef: setActivator,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id,
    disabled: locked,
    transition: reducedMotion ? null : { duration: SHIFT_MS, easing: EASING },
    attributes: { roleDescription: t.adminContent.sortable.roleDescription },
  });

  const handle = useMemo(
    () => ({ label, attributes, listeners, setActivator, disabled, canReorder }),
    [label, attributes, listeners, setActivator, disabled, canReorder],
  );

  return (
    <SortableItemContext.Provider value={handle}>
      <Tag
        ref={setNodeRef}
        style={{ transform: CSS.Transform.toString(transform), transition }}
        // The item that is being dragged stays in the list as a dimmed placeholder.
        className={cn('relative', isDragging && 'opacity-40')}
      >
        {children}
      </Tag>
    </SortableItemContext.Provider>
  );
}

interface LiftedCopyProps {
  reducedMotion: boolean;
  className?: string;
  children: ReactNode;
}

/** The copy that follows the pointer: it lifts (shadow, a little bigger) over a short moment. */
function LiftedCopy({ reducedMotion, className, children }: LiftedCopyProps) {
  const [lifted, setLifted] = useState(false);

  useEffect(() => {
    const frame = requestAnimationFrame(() => setLifted(true));
    return () => cancelAnimationFrame(frame);
  }, []);

  return (
    <div
      className={cn(
        // It only follows the pointer, so hover colors of the row do not light up under it.
        'pointer-events-none',
        reducedMotion
          ? 'shadow-(--shadow-lift)'
          : 'transition-[scale,box-shadow] duration-(--motion-duration-sm) ease-(--motion-ease)',
        !reducedMotion && (lifted ? 'scale-102 shadow-(--shadow-lift)' : 'shadow-none'),
        className,
      )}
    >
      {children}
    </div>
  );
}

interface SortableListProps<T extends { id: string }> {
  items: readonly T[];
  /**
   * Called after a drop that changed the order, with the ids of ALL items in the new order. Return
   * the request: the list shows the new order at once and ignores new drags until it settles,
   * then shows whatever `items` holds (the new order, or the old one when the request failed).
   */
  onReorder: (ids: string[]) => Promise<unknown>;
  /** Name of an item: names its grip and is read out by the screen reader announcements. */
  getLabel: (item: T) => string;
  /**
   * The content of an item. Put a `<DragHandle />` in it. `overlay` is true for the copy that
   * follows the pointer, which should be a compact version (for example without nested lists).
   */
  renderItem: (item: T, state: { overlay: boolean }) => ReactNode;
  /** `list`: rows in a column. `grid`: cards that also move sideways. */
  layout?: 'list' | 'grid';
  /** Locks dragging and dims the grips. */
  disabled?: boolean;
  /** `ul` renders the items as `li`. */
  as?: 'div' | 'ul';
  className?: string;
  /** Classes of the lifted copy, mostly the corner radius of the items, so the shadow follows it. */
  overlayClassName?: string;
  'aria-label'?: string;
}

/**
 * A list whose items are reordered by drag and drop (dnd-kit): grip on every item, a lifted copy
 * with a raised shadow, a dimmed placeholder, the others glide aside, the page scrolls near its
 * edges. Works with mouse, touch (short press) and keyboard (Space, arrows, Space, Esc), with
 * Ukrainian screen reader announcements. Motion is switched off for `prefers-reduced-motion`.
 * Items only move inside their own list.
 */
export function SortableList<T extends { id: string }>({
  items,
  onReorder,
  getLabel,
  renderItem,
  layout = 'list',
  disabled = false,
  as = 'div',
  className,
  overlayClassName,
  'aria-label': ariaLabel,
}: SortableListProps<T>) {
  const copy = t.adminContent.sortable;
  const contextId = useId();
  const reducedMotion = useReducedMotion();
  const [activeId, setActiveId] = useState<string | null>(null);
  // The order that was just dropped, until its request settles; the list shows it at once, so the
  // lifted copy lands on the final place instead of flying back to the old one.
  const [droppedIds, setDroppedIds] = useState<string[] | null>(null);
  // The item the drag was last announced over; the start counts, so "picked up" is not drowned out.
  const announcedOver = useRef<UniqueIdentifier | null>(null);
  const Container = as;

  const sensors = useSensors(
    // Only the grip carries the listeners, so a press anywhere else never starts a drag.
    useSensor(MousePenSensor, { activationConstraint: { distance: POINTER_DISTANCE } }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: TOUCH_DELAY_MS, tolerance: TOUCH_TOLERANCE },
    }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const shown = useMemo(
    () => (droppedIds ? sortByIds(items, droppedIds) : items),
    [items, droppedIds],
  );
  const ids = useMemo(() => shown.map((item) => item.id), [shown]);
  const activeItem = activeId === null ? undefined : shown.find((item) => item.id === activeId);
  const locked = disabled || droppedIds !== null;

  // The pointer can be anywhere on the page while dragging, so the closed hand follows it.
  useEffect(() => {
    if (activeId === null) return;

    const style = document.createElement('style');
    style.textContent = '* { cursor: grabbing !important; }';
    document.head.append(style);
    return () => style.remove();
  }, [activeId]);

  const announcements = useMemo<Announcements>(() => {
    const total = shown.length;
    const titleOf = (id: UniqueIdentifier) => {
      const item = shown.find((candidate) => candidate.id === String(id));
      return item ? getLabel(item) : '';
    };
    const positionOf = (id: UniqueIdentifier) => ids.indexOf(String(id)) + 1;

    return {
      onDragStart: ({ active }) => {
        announcedOver.current = active.id;
        return format(copy.picked, {
          title: titleOf(active.id),
          position: positionOf(active.id),
          total,
        });
      },
      onDragOver: ({ active, over }) => {
        if (!over || over.id === announcedOver.current) return undefined;

        announcedOver.current = over.id;
        return format(copy.moved, {
          title: titleOf(active.id),
          position: positionOf(over.id),
          total,
        });
      },
      onDragEnd: ({ active, over }) =>
        over
          ? format(active.id === over.id ? copy.droppedSame : copy.dropped, {
              title: titleOf(active.id),
              position: positionOf(over.id),
              total,
            })
          : format(copy.cancelled, {
              title: titleOf(active.id),
              position: positionOf(active.id),
              total,
            }),
      onDragCancel: ({ active }) =>
        format(copy.cancelled, {
          title: titleOf(active.id),
          position: positionOf(active.id),
          total,
        }),
    };
  }, [shown, ids, getLabel, copy]);

  function handleDragEnd({ active, over }: DragEndEvent) {
    setActiveId(null);
    if (!over || active.id === over.id) return;

    const from = ids.indexOf(String(active.id));
    const to = ids.indexOf(String(over.id));
    if (from === -1 || to === -1) return;

    const next = arrayMove(ids, from, to);
    setDroppedIds(next);

    let request: Promise<unknown>;
    try {
      request = onReorder(next);
    } catch {
      request = Promise.resolve();
    }
    void request.catch(() => undefined).finally(() => setDroppedIds(null));
  }

  return (
    <DndContext
      id={contextId}
      sensors={sensors}
      collisionDetection={layout === 'grid' ? closestCenter : rowUnderPointer}
      modifiers={layout === 'list' ? ROW_MODIFIERS : undefined}
      accessibility={{ announcements, screenReaderInstructions: { draggable: copy.instructions } }}
      onDragStart={({ active }) => setActiveId(String(active.id))}
      onDragEnd={handleDragEnd}
      onDragCancel={() => setActiveId(null)}
    >
      <SortableContext
        items={ids}
        strategy={layout === 'grid' ? rectSortingStrategy : verticalListSortingStrategy}
        disabled={locked}
      >
        <Container className={className} aria-label={ariaLabel}>
          {shown.map((item) => (
            <SortableItem
              key={item.id}
              id={item.id}
              label={getLabel(item)}
              disabled={disabled}
              locked={locked}
              canReorder={shown.length > 1}
              reducedMotion={reducedMotion}
              as={as === 'ul' ? 'li' : 'div'}
            >
              {renderItem(item, { overlay: false })}
            </SortableItem>
          ))}
        </Container>
      </SortableContext>

      <DragOverlay dropAnimation={reducedMotion ? null : DROP_ANIMATION}>
        {activeItem ? (
          <LiftedCopy reducedMotion={reducedMotion} className={overlayClassName}>
            {renderItem(activeItem, { overlay: true })}
          </LiftedCopy>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
