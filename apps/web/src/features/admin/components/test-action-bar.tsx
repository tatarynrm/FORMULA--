'use client';

import { Eye, EyeOff } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { t } from '@/locales';

import type { TestEditorController } from '../hooks/use-test-editor';
import { UnsavedBadge } from './unsaved-badge';

interface TestActionBarProps {
  editor: TestEditorController;
  /**
   * `always`: the bar follows the scroll (the page editor, where it floats over the whole page).
   * `when-pending`: it follows only while there is something to save or a message to read, and
   * otherwise stays at the end of its section. A section on a long page must not float over the
   * heading of the section below it just because that heading is not scrolled into view yet.
   */
  follow?: 'always' | 'when-pending';
}

/**
 * Bar under an editor: the result of the last action, the "unsaved" indicator, publish /
 * unpublish and save. It sits next to the buttons, so a failure is seen wherever the admin is in
 * a long list of questions.
 */
export function TestActionBar({ editor, follow = 'always' }: TestActionBarProps) {
  const copy = t.adminContent.testEditor.actions;
  const { notice, dirty, published, working, busy } = editor;
  const sticky = follow === 'always' || dirty || notice !== null;

  return (
    <div
      className={cn(
        'bg-surface-raised border-input flex flex-col gap-3 rounded-2xl border p-3 md:px-5',
        sticky && 'sticky bottom-4 z-10 shadow-lg',
      )}
    >
      {notice ? (
        <p
          role={notice.kind === 'error' ? 'alert' : 'status'}
          className={cn(
            'text-body-sm rounded-xl px-3 py-2',
            notice.kind === 'error'
              ? 'bg-input-error-bg text-input-error-text'
              : 'bg-success-soft text-success',
          )}
        >
          {notice.text}
        </p>
      ) : null}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-h-6">
          {dirty ? (
            <UnsavedBadge />
          ) : (
            <p className="text-body-sm text-muted-foreground">{t.adminContent.unsaved.clean}</p>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {published ? (
            <Button
              type="button"
              variant="secondary"
              disabled={busy}
              onClick={() => void editor.unpublish()}
            >
              <EyeOff />
              {copy.unpublish}
            </Button>
          ) : (
            <Button
              type="button"
              variant="secondary"
              disabled={busy}
              onClick={() => void editor.publish()}
            >
              <Eye />
              {working === 'publish' ? copy.publishing : copy.publish}
            </Button>
          )}
          <Button type="button" disabled={!dirty || busy} onClick={() => void editor.save()}>
            {working === 'save' ? copy.saving : copy.save}
          </Button>
        </div>
      </div>
    </div>
  );
}
