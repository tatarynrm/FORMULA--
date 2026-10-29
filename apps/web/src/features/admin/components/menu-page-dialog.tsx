'use client';

import type { MenuItemAdmin } from '@formula/shared';
import { useState } from 'react';

import { LogoLoader } from '@/components/common/logo-loader';
import { RichTextEditor } from '@/components/common/rich-text/rich-text-editor';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useMenuPageEditor } from '@/features/menu/hooks/use-menu';
import { t } from '@/locales';

interface MenuPageDialogProps {
  item: MenuItemAdmin;
  onClose: () => void;
}

/** Writes the text of a page-kind menu item with the rich text editor. */
export function MenuPageDialog({ item, onClose }: MenuPageDialogProps) {
  const copy = t.admin.menu.pageDialog;
  const { body, save } = useMenuPageEditor(item.id);

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>
            {copy.title}: {item.label}
          </DialogTitle>
        </DialogHeader>

        {body.isError ? (
          <p role="alert" className="text-body-sm text-input-error-text">
            {copy.loadError}
          </p>
        ) : body.data ? (
          // The editor starts from the stored text; its draft lives in `Editor` until it is saved.
          <Editor
            initial={body.data.bodyHtml}
            saving={save.isPending}
            failed={save.isError}
            saved={save.isSuccess}
            onSave={(html) => save.mutate(html)}
            onClose={onClose}
          />
        ) : (
          <LogoLoader size="md" className="min-h-60" />
        )}
      </DialogContent>
    </Dialog>
  );
}

function Editor({
  initial,
  saving,
  failed,
  saved,
  onSave,
  onClose,
}: {
  initial: string;
  saving: boolean;
  failed: boolean;
  saved: boolean;
  onSave: (html: string) => void;
  onClose: () => void;
}) {
  const copy = t.admin.menu.pageDialog;
  const [html, setHtml] = useState(initial);

  return (
    <div className="flex flex-col gap-4">
      <RichTextEditor value={html} onChange={setHtml} label={copy.label} />

      {failed ? (
        <p role="alert" className="text-body-sm text-input-error-text">
          {copy.saveError}
        </p>
      ) : null}
      {saved && !failed ? (
        <p role="status" className="text-body-sm text-success">
          {copy.saved}
        </p>
      ) : null}

      <DialogFooter>
        <Button type="button" variant="secondary" onClick={onClose}>
          {copy.close}
        </Button>
        <Button type="button" disabled={saving} onClick={() => onSave(html)}>
          {saving ? t.common.loading : copy.save}
        </Button>
      </DialogFooter>
    </div>
  );
}
