'use client';

import type { MenuAudience, MenuItemAdmin } from '@formula/shared';
import {
  ChevronDown,
  ChevronUp,
  Eye,
  EyeOff,
  FileText,
  Plus,
  SquarePen,
  Trash2,
} from 'lucide-react';
import { useState } from 'react';

import { EmptyState } from '@/components/common/empty-state';
import { LogoLoader } from '@/components/common/logo-loader';
import { MaskIcon } from '@/components/common/mask-icon';
import { SegmentedControl } from '@/components/common/segmented-control';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useMenuEditor, useMenuMutations } from '@/features/menu/hooks/use-menu';
import { getMenuIconSrc } from '@/features/menu/icons';
import { cn } from '@/lib/utils';
import { t } from '@/locales';

import { AdminPageHeader } from './admin-page-header';
import { MenuItemDialog } from './menu-item-dialog';
import { MenuPageDialog } from './menu-page-dialog';

const AUDIENCE_TABS = [
  { id: 'student', label: t.admin.menu.audiences.student },
  { id: 'admin', label: t.admin.menu.audiences.admin },
] as const;

/** Superadmin tool: reorder, rename, hide and add the sections of the student and the admin menu. */
export function MenuEditor() {
  const copy = t.admin.menu;
  const [audience, setAudience] = useState<MenuAudience>('student');
  const { data: items, isPending, isError } = useMenuEditor(audience);
  const { update, remove, reorder } = useMenuMutations(audience);

  // `undefined` while closed, `null` when adding.
  const [editing, setEditing] = useState<MenuItemAdmin | null | undefined>(undefined);
  const [toDelete, setToDelete] = useState<MenuItemAdmin | null>(null);
  // The page whose text is being written (a page item's text is edited in its own dialog).
  const [pageItem, setPageItem] = useState<MenuItemAdmin | null>(null);

  function move(index: number, direction: -1 | 1) {
    if (!items) return;
    const target = index + direction;
    if (target < 0 || target >= items.length) return;

    const ids = items.map((item) => item.id);
    [ids[index], ids[target]] = [ids[target]!, ids[index]!];
    reorder.mutate(ids);
  }

  return (
    <div className="flex flex-col gap-6">
      <AdminPageHeader
        title={copy.title}
        actions={
          <Button onClick={() => setEditing(null)}>
            <Plus />
            {copy.add}
          </Button>
        }
      />
      <p className="text-body-md text-text-secondary">{copy.intro}</p>

      <SegmentedControl
        label={copy.title}
        items={AUDIENCE_TABS}
        value={audience}
        onValueChange={setAudience}
        className="max-w-md"
      />

      {isError ? (
        <EmptyState title={copy.loadError} />
      ) : isPending ? (
        <LogoLoader size="lg" fill />
      ) : (
        <ul className="flex flex-col gap-2">
          {items.map((item, index) => (
            <li
              key={item.id}
              className={cn(
                'bg-surface-raised border-input flex flex-wrap items-center justify-between gap-4 rounded-2xl border p-4',
                !item.isActive && 'opacity-60',
              )}
            >
              <div className="flex min-w-0 items-center gap-3">
                <MaskIcon src={getMenuIconSrc(item.icon)} className="text-text-secondary size-6" />
                <div className="flex min-w-0 flex-col gap-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-body-md text-foreground font-bold">{item.label}</p>
                    {item.isSystem ? <Badge variant="secondary">{copy.builtIn}</Badge> : null}
                    {item.kind === 'page' ? (
                      <Badge variant="secondary">{copy.pageBadge}</Badge>
                    ) : null}
                    {item.superadminOnly ? (
                      <Badge variant="brand">{copy.superadminOnly}</Badge>
                    ) : null}
                    {!item.isActive ? <Badge variant="secondary">{copy.hidden}</Badge> : null}
                  </div>
                  <p className="text-body-xs text-muted-foreground truncate">{item.href}</p>
                </div>
              </div>

              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="icon-sm"
                  aria-label={copy.moveUp}
                  disabled={index === 0 || reorder.isPending}
                  onClick={() => move(index, -1)}
                >
                  <ChevronUp />
                </Button>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  aria-label={copy.moveDown}
                  disabled={index === items.length - 1 || reorder.isPending}
                  onClick={() => move(index, 1)}
                >
                  <ChevronDown />
                </Button>
                {!item.superadminOnly ? (
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    aria-label={item.isActive ? copy.hide : copy.show}
                    title={item.isActive ? copy.hide : copy.show}
                    onClick={() =>
                      update.mutate({ id: item.id, input: { isActive: !item.isActive } })
                    }
                  >
                    {item.isActive ? <Eye /> : <EyeOff />}
                  </Button>
                ) : null}
                {item.kind === 'page' ? (
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    aria-label={copy.editPage}
                    title={copy.editPage}
                    onClick={() => setPageItem(item)}
                  >
                    <FileText />
                  </Button>
                ) : null}
                <Button
                  variant="ghost"
                  size="icon-sm"
                  aria-label={copy.edit}
                  onClick={() => setEditing(item)}
                >
                  <SquarePen />
                </Button>
                {!item.isSystem ? (
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    aria-label={copy.delete}
                    onClick={() => setToDelete(item)}
                  >
                    <Trash2 />
                  </Button>
                ) : null}
              </div>
            </li>
          ))}
        </ul>
      )}

      {editing !== undefined ? (
        <MenuItemDialog
          key={editing?.id ?? 'new'}
          audience={audience}
          item={editing}
          onClose={() => setEditing(undefined)}
          onPageCreated={setPageItem}
        />
      ) : null}

      {pageItem ? (
        <MenuPageDialog key={pageItem.id} item={pageItem} onClose={() => setPageItem(null)} />
      ) : null}

      <AlertDialog open={toDelete !== null} onOpenChange={(open) => !open && setToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{copy.deleteTitle}</AlertDialogTitle>
            <AlertDialogDescription>{copy.deleteDescription}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t.common.cancel}</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (toDelete) remove.mutate(toDelete.id);
              }}
            >
              {copy.deleteConfirm}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
