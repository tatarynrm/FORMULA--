'use client';

import {
  MENU_ICONS,
  type MenuAudience,
  type MenuIcon,
  type MenuItemAdmin,
  type MenuItemKind,
} from '@formula/shared';
import { useState } from 'react';

import { MaskIcon } from '@/components/common/mask-icon';
import { SegmentedControl } from '@/components/common/segmented-control';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useMenuMutations } from '@/features/menu/hooks/use-menu';
import { getMenuIconSrc } from '@/features/menu/icons';
import { cn } from '@/lib/utils';
import { t } from '@/locales';

interface MenuItemDialogProps {
  audience: MenuAudience;
  /** `null` adds a new item. */
  item: MenuItemAdmin | null;
  onClose: () => void;
  /** Called with the new item when it is a page, so its text can be written right away. */
  onPageCreated?: (item: MenuItemAdmin) => void;
}

/** Create or edit one menu item: name, what it opens (a link or a page with text) and icon. */
export function MenuItemDialog({ audience, item, onClose, onPageCreated }: MenuItemDialogProps) {
  const copy = t.admin.menu.dialog;
  const editing = item !== null;
  const { create, update } = useMenuMutations(audience);

  const [label, setLabel] = useState(item?.label ?? '');
  const [href, setHref] = useState(item?.href ?? '');
  const [icon, setIcon] = useState<MenuIcon>(item?.icon ?? 'file');
  const [kind, setKind] = useState<MenuItemKind>(item?.kind ?? 'link');

  const mutation = editing ? update : create;
  // The address of a page is made by the api and never changes.
  const needsHref = kind === 'link';

  function submit() {
    if (editing) {
      update.mutate(
        { id: item.id, input: { label, icon, ...(needsHref ? { href } : {}) } },
        { onSuccess: onClose },
      );
      return;
    }

    const payload =
      kind === 'link'
        ? ({ kind, audience, label, href, icon } as const)
        : ({ kind, audience, label, icon } as const);
    create.mutate(payload, {
      onSuccess: (created) => {
        onClose();
        if (created.kind === 'page') onPageCreated?.(created);
      },
    });
  }

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{editing ? copy.editTitle : copy.addTitle}</DialogTitle>
        </DialogHeader>

        <form
          className="flex flex-col gap-4"
          onSubmit={(event) => {
            event.preventDefault();
            submit();
          }}
        >
          {!editing ? (
            <div className="flex flex-col gap-1.5">
              <span className="text-body-md text-foreground font-medium">{copy.kind}</span>
              <SegmentedControl
                label={copy.kind}
                value={kind}
                onValueChange={setKind}
                items={[
                  { id: 'link', label: copy.kinds.link },
                  { id: 'page', label: copy.kinds.page },
                ]}
              />
            </div>
          ) : null}

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="menu-label">{copy.label}</Label>
            <Input
              id="menu-label"
              required
              maxLength={40}
              value={label}
              onChange={(event) => setLabel(event.target.value)}
            />
          </div>

          {needsHref ? (
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="menu-href">{copy.href}</Label>
              <Input
                id="menu-href"
                required
                maxLength={200}
                placeholder="/cabinet/news"
                value={href}
                onChange={(event) => setHref(event.target.value)}
              />
              <p className="text-body-xs text-muted-foreground">{copy.hrefHint}</p>
            </div>
          ) : (
            <p className="text-body-sm text-muted-foreground">{copy.pageHint}</p>
          )}

          <fieldset className="flex flex-col gap-2">
            <legend className="text-body-md text-foreground mb-1 font-medium">{copy.icon}</legend>
            <div className="flex flex-wrap gap-2">
              {MENU_ICONS.map((name) => (
                <button
                  key={name}
                  type="button"
                  aria-pressed={icon === name}
                  aria-label={t.admin.menu.icons[name]}
                  title={t.admin.menu.icons[name]}
                  onClick={() => setIcon(name)}
                  className={cn(
                    'flex size-11 items-center justify-center rounded-xl border transition-colors',
                    icon === name
                      ? 'border-primary bg-background text-primary'
                      : 'border-input text-muted-foreground hover:text-foreground',
                  )}
                >
                  <MaskIcon src={getMenuIconSrc(name)} className="size-5" />
                </button>
              ))}
            </div>
          </fieldset>

          {mutation.isError ? (
            <p role="alert" className="text-body-sm text-input-error-text">
              {copy.error}
            </p>
          ) : null}

          <DialogFooter>
            <Button type="button" variant="secondary" onClick={onClose}>
              {copy.cancel}
            </Button>
            <Button
              type="submit"
              disabled={mutation.isPending || !label.trim() || (needsHref && !href.trim())}
            >
              {mutation.isPending ? t.common.loading : copy.submit}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
