'use client';

import type { AdminSubtopic } from '@formula/shared';
import { useRef, useState } from 'react';

import { RichTextEditor } from '@/components/common/rich-text/rich-text-editor';
import { Button } from '@/components/ui/button';
import { t } from '@/locales';

import { useSubtopicMutations } from '../hooks/use-subtopic';
import { useUnsavedChangesWarning } from '../hooks/use-unsaved-changes-warning';
import { describeApiError } from '../utils/api-error';
import { normalizeHtml } from '../utils/normalize-html';
import { ErrorNotice } from './error-notice';
import { SectionCard } from './section-card';
import { UnsavedBadge } from './unsaved-badge';

/**
 * The rich text description of a subtopic (what students read on its page). The text is saved
 * with an explicit button; the api sanitizes the html, and the editor then shows what was stored.
 */
export function SubtopicDescription({ subtopic }: { subtopic: AdminSubtopic }) {
  const copy = t.adminContent.subtopicEditor.description;
  const { update } = useSubtopicMutations(subtopic.id);
  const [html, setHtml] = useState(subtopic.descriptionHtml);
  // What is stored, to tell whether there is anything to save.
  const [savedHtml, setSavedHtml] = useState(subtopic.descriptionHtml);
  const [error, setError] = useState<string | null>(null);
  const [justSaved, setJustSaved] = useState(false);
  // Whether the admin did anything in the editor yet (typed, pasted, used the toolbar).
  const touched = useRef(false);
  const markTouched = () => {
    touched.current = true;
  };

  // The editor and the api write the same html slightly differently (`<br>` and `<br />`), so the
  // two are compared in their canonical form.
  const dirty = normalizeHtml(html) !== normalizeHtml(savedHtml);
  useUnsavedChangesWarning(dirty);

  async function save() {
    setError(null);
    setJustSaved(false);
    try {
      const stored = await update.mutateAsync({ descriptionHtml: html });
      setHtml(stored.descriptionHtml);
      setSavedHtml(stored.descriptionHtml);
      setJustSaved(true);
    } catch (caught) {
      setError(describeApiError(caught, copy.error));
    }
  }

  return (
    <SectionCard title={copy.title} description={copy.hint}>
      {/* Capture handlers only note that the admin started editing; they change nothing. */}
      <div
        onKeyDownCapture={markTouched}
        onPasteCapture={markTouched}
        onCutCapture={markTouched}
        onDropCapture={markTouched}
        onPointerDownCapture={markTouched}
      >
        <RichTextEditor
          value={html}
          onChange={(next) => {
            setHtml(next);
            if (!touched.current) {
              // Right after it opens the editor reports its own tidied-up copy of the stored text.
              // Nothing was typed yet, so that is not an edit and there is nothing to save.
              setSavedHtml(next);
              return;
            }
            // Later it also reports updates that change nothing (for example while it is locked).
            if (normalizeHtml(next) !== normalizeHtml(savedHtml)) setJustSaved(false);
          }}
          label={copy.editorLabel}
          disabled={update.isPending}
        />
      </div>

      <ErrorNotice message={error} />

      <div className="flex flex-wrap items-center gap-3">
        <Button type="button" onClick={() => void save()} disabled={!dirty || update.isPending}>
          {update.isPending ? t.adminContent.common.saving : copy.save}
        </Button>
        {dirty ? <UnsavedBadge /> : null}
        {justSaved && !dirty ? (
          <p role="status" className="text-body-sm text-success">
            {copy.saved}
          </p>
        ) : null}
      </div>
    </SectionCard>
  );
}
