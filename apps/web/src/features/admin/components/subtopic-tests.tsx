'use client';

import type { AdminTest, TestKind } from '@formula/shared';
import { useQueryClient } from '@tanstack/react-query';
import { ArrowLeftRight } from 'lucide-react';
import { useState } from 'react';

import { LogoLoader } from '@/components/common/logo-loader';
import { Button } from '@/components/ui/button';
import { format } from '@/lib/format';
import { t } from '@/locales';

import { useAdminTest, useAdminTests, useTestMutations } from '../hooks/use-admin-tests';
import { useTestEditor } from '../hooks/use-test-editor';
import { adminKeys } from '../hooks/query-keys';
import { describeApiError, isApiStatus } from '../utils/api-error';
import { ConfirmDialog } from './confirm-dialog';
import { ErrorNotice } from './error-notice';
import { QuestionBuilder } from './question-builder/question-builder';
import { ValidationHints } from './question-builder/validation-hints';
import { SectionCard } from './section-card';
import { StatusBadge } from './status-badge';
import { TestActionBar } from './test-action-bar';
import { TestKindBadge } from './test-kind-badge';
import { TestKindPicker } from './test-kind-picker';
import { TimeLimitFields } from './time-limit-fields';

const otherKind = (kind: TestKind): TestKind => (kind === 'choice' ? 'situational' : 'choice');

/** "Тестування" without a test yet: the admin picks the kind, and the test is created as a draft. */
function SubtopicTestChooser({ subtopicId }: { subtopicId: string }) {
  const copy = t.adminContent.subtopicEditor.testing;
  const queryClient = useQueryClient();
  const { create } = useTestMutations();
  const [kind, setKind] = useState<TestKind>('choice');
  const [error, setError] = useState<string | null>(null);

  async function createTest() {
    setError(null);
    try {
      await create.mutateAsync({
        kind,
        collection: 'subtopic',
        subtopicId,
        title: copy.kinds[kind].title,
      });
    } catch (caught) {
      // Somebody else created the test meanwhile: the list shows that one, whatever its kind.
      if (isApiStatus(caught, 409)) {
        await queryClient.invalidateQueries({ queryKey: adminKeys.tests('subtopic', subtopicId) });
        return;
      }
      setError(describeApiError(caught, copy.createError));
    }
  }

  return (
    <SectionCard title={copy.title} description={copy.chooseHint}>
      <TestKindPicker value={kind} onChange={setKind} />
      <ErrorNotice message={error} />
      <div>
        <Button type="button" disabled={create.isPending} onClick={() => void createTest()}>
          {create.isPending ? copy.creating : copy.create}
        </Button>
      </div>
    </SectionCard>
  );
}

/**
 * The test of a subtopic, edited in place: the optional total time, the questions (add, edit,
 * reorder, delete) and publishing. Its kind can still be changed while it has no questions.
 */
function SubtopicTestEditor({ test }: { test: AdminTest }) {
  const copy = t.adminContent.subtopicEditor.testing;
  const editor = useTestEditor({ initial: test, scope: 'time-limit' });
  const { update } = useTestMutations();
  const [confirmKind, setConfirmKind] = useState(false);
  const [kindError, setKindError] = useState<string | null>(null);
  const nextKind = otherKind(test.kind);
  // The draft counts too: questions typed but not saved yet are of this kind as well.
  const kindLocked = editor.questions.length > 0;

  async function changeKind() {
    setKindError(null);
    try {
      // The editor is mounted anew for the new kind (see the key in `SubtopicTests`).
      await update.mutateAsync({
        id: test.id,
        patch: { kind: nextKind, title: copy.kinds[nextKind].title },
      });
    } catch (caught) {
      setKindError(describeApiError(caught, copy.changeKindError));
    }
  }

  return (
    <SectionCard
      title={copy.title}
      description={copy.kinds[test.kind].description}
      actions={
        <>
          <TestKindBadge kind={test.kind} />
          <StatusBadge status={editor.status} />
          <Button
            type="button"
            variant="ghost"
            size="sm"
            disabled={kindLocked || editor.busy || update.isPending}
            aria-describedby={kindLocked ? `${editor.anchor}-kind-locked` : undefined}
            onClick={() => setConfirmKind(true)}
          >
            <ArrowLeftRight />
            {copy.changeKind}
          </Button>
        </>
      }
    >
      {kindLocked ? (
        <p id={`${editor.anchor}-kind-locked`} className="text-body-sm text-muted-foreground">
          {copy.changeKindLocked}
        </p>
      ) : null}
      <ErrorNotice message={kindError} />

      {/* Everything is locked while a request runs, so the saved copy always matches what is on screen. */}
      <fieldset disabled={editor.busy || update.isPending} className="contents">
        <div id={`${editor.anchor}-settings`} tabIndex={-1} className="scroll-mt-6 outline-none">
          <TimeLimitFields
            settings={editor.settings}
            onChange={editor.changeSettings}
            problem={editor.problems.find((problem) => problem.id === 'time-limit')}
          />
        </div>

        <ValidationHints
          problems={editor.problems}
          emphasize={editor.emphasizeProblems}
          onGoTo={editor.goTo}
        />

        <div id={`${editor.anchor}-questions`} tabIndex={-1} className="scroll-mt-6 outline-none">
          <QuestionBuilder
            kind={test.kind}
            questions={editor.questions}
            invalidKeys={editor.invalidKeys}
            dispatch={editor.dispatch}
          />
        </div>
      </fieldset>

      <TestActionBar editor={editor} follow="when-pending" />

      <ConfirmDialog
        open={confirmKind}
        onOpenChange={setConfirmKind}
        title={copy.changeKindTitle}
        description={[
          format(copy.changeKindDescription, { kind: t.adminContent.tests.kinds[nextKind] }),
          editor.dirty ? copy.changeKindUnsaved : '',
        ]
          .filter(Boolean)
          .join(' ')}
        confirmLabel={copy.changeKindConfirm}
        onConfirm={() => void changeKind()}
      />
    </SectionCard>
  );
}

/** Loads the stored test with its questions and hands it to the editor. */
function SubtopicTestLoader({ id }: { id: string }) {
  const copy = t.adminContent.subtopicEditor.testing;
  const full = useAdminTest(id);

  if (full.isError) {
    return (
      <SectionCard title={copy.title}>
        <p role="alert" className="text-body-sm text-input-error-text">
          {copy.loadError}
        </p>
      </SectionCard>
    );
  }
  if (full.isPending) {
    return (
      <SectionCard title={copy.title}>
        <LogoLoader size="md" className="py-8" />
      </SectionCard>
    );
  }

  // The editor copies the test once; a change of kind (questions look different) mounts it anew.
  return <SubtopicTestEditor key={`${full.data.id}:${full.data.kind}`} test={full.data} />;
}

/**
 * "Тестування" of a subtopic: it has one test, whose kind the admin picks when creating it (with
 * answer options, or a written answer that is reviewed). The questions are entered right here.
 */
export function SubtopicTests({ subtopicId }: { subtopicId: string }) {
  const copy = t.adminContent.subtopicEditor.testing;
  const { data: tests, isPending, isError } = useAdminTests('subtopic', subtopicId);

  if (isError) {
    return (
      <SectionCard title={copy.title}>
        <p role="alert" className="text-body-sm text-input-error-text">
          {copy.listError}
        </p>
      </SectionCard>
    );
  }
  if (isPending) {
    return (
      <SectionCard title={copy.title}>
        <LogoLoader size="md" className="py-8" />
      </SectionCard>
    );
  }

  // The api keeps one test per subtopic; should an older subtopic still have two, the first one
  // (the api sorts them) is the one that is edited.
  const test = tests[0];
  return test ? (
    <SubtopicTestLoader id={test.id} />
  ) : (
    <SubtopicTestChooser subtopicId={subtopicId} />
  );
}
