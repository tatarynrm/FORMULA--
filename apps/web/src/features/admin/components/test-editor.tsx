'use client';

import type { AdminTest, TestCollection } from '@formula/shared';
import { Trash2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

import { EmptyState } from '@/components/common/empty-state';
import { LinkButton } from '@/components/common/link-button';
import { LogoLoader } from '@/components/common/logo-loader';
import { Button } from '@/components/ui/button';
import { format } from '@/lib/format';
import { t } from '@/locales';

import { useAdminTest } from '../hooks/use-admin-tests';
import { useTestEditor } from '../hooks/use-test-editor';
import { isApiStatus } from '../utils/api-error';
import { AdminPageHeader } from './admin-page-header';
import { ConfirmDialog } from './confirm-dialog';
import { PageTitle } from './page-title';
import { QuestionBuilder } from './question-builder/question-builder';
import { ValidationHints } from './question-builder/validation-hints';
import { SectionCard } from './section-card';
import { StatusBadge } from './status-badge';
import { TestActionBar } from './test-action-bar';
import { TestKindBadge } from './test-kind-badge';
import { TestSettingsForm } from './test-settings-form';

type ListedCollection = Exclude<TestCollection, 'subtopic'>;

const LIST_HREFS: Record<ListedCollection, string> = {
  base: '/admin/bases',
  booklet: '/admin/booklets',
  amps: '/admin/amps',
};

interface TestEditorFormProps {
  test: AdminTest;
  collection: ListedCollection;
}

/** Settings, questions and publishing of one base, booklet or AMPS test. */
function TestEditorForm({ test, collection }: TestEditorFormProps) {
  const copy = t.adminContent.testEditor;
  const router = useRouter();
  const listHref = LIST_HREFS[collection];
  const editor = useTestEditor({
    initial: test,
    scope: 'collection',
    onDeleted: () => router.replace(listHref),
  });
  const [confirmDelete, setConfirmDelete] = useState(false);
  const title = editor.stored?.title ?? test.title;

  return (
    <div className="flex max-w-5xl flex-col gap-6">
      <AdminPageHeader backHref={listHref} title={<PageTitle>{title}</PageTitle>} />

      <div className="flex flex-wrap items-center gap-3">
        <TestKindBadge kind={test.kind} />
        <StatusBadge status={editor.status} />
        <p className="text-body-sm text-muted-foreground">
          {editor.published ? copy.publishedHint : copy.draftHint}
        </p>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="text-destructive ml-auto"
          disabled={editor.busy}
          onClick={() => setConfirmDelete(true)}
        >
          <Trash2 />
          {copy.actions.delete}
        </Button>
      </div>

      {/* Everything is locked while a request runs, so the saved copy always matches what is on screen. */}
      <fieldset disabled={editor.busy} className="contents">
        <TestSettingsForm
          id={`${editor.anchor}-settings`}
          kind={test.kind}
          collection={collection}
          settings={editor.settings}
          onChange={editor.changeSettings}
          problems={editor.problems}
        />

        <ValidationHints
          problems={editor.problems}
          emphasize={editor.emphasizeProblems}
          onGoTo={editor.goTo}
        />

        <SectionCard
          id={`${editor.anchor}-questions`}
          tabIndex={-1}
          className="scroll-mt-6"
          title={copy.questions.title}
        >
          <QuestionBuilder
            kind={test.kind}
            questions={editor.questions}
            invalidKeys={editor.invalidKeys}
            dispatch={editor.dispatch}
          />
        </SectionCard>
      </fieldset>

      <TestActionBar editor={editor} />

      <ConfirmDialog
        open={confirmDelete}
        onOpenChange={setConfirmDelete}
        title={t.adminContent.tests.deleteTitle}
        description={format(t.adminContent.tests.deleteDescription, { title })}
        confirmLabel={t.adminContent.common.delete}
        onConfirm={() => void editor.deleteTest()}
      />
    </div>
  );
}

/** Tests of a subtopic are edited inside the subtopic, so an old link to one goes there. */
function RedirectToSubtopic({ href }: { href: string }) {
  const router = useRouter();

  useEffect(() => {
    router.replace(href);
  }, [router, href]);

  return <LogoLoader size="lg" fill />;
}

/**
 * Editor of one test of the bases, booklets and AMPS lists. The two tests of a subtopic live on
 * the subtopic page instead.
 */
export function TestEditor({ id }: { id: string }) {
  const copy = t.adminContent.testEditor;
  const { data: test, isPending, isError, error } = useAdminTest(id);

  if (isError) {
    return (
      <div className="flex flex-col gap-6">
        <AdminPageHeader title={copy.pageTitle} backHref="/admin" />
        <EmptyState
          title={
            isApiStatus(error, 404)
              ? copy.notFound
              : isApiStatus(error, 403)
                ? copy.forbidden
                : copy.loadError
          }
          action={
            <LinkButton href="/admin" variant="secondary">
              {t.admin.subjects.title}
            </LinkButton>
          }
        />
      </div>
    );
  }

  if (isPending) return <LogoLoader size="lg" fill />;

  const { collection } = test;
  if (collection === 'subtopic') {
    return (
      <RedirectToSubtopic
        href={test.subtopicId ? `/admin/subtopics/${test.subtopicId}` : '/admin'}
      />
    );
  }

  // Keyed by id: the form copies the loaded test once, for this test only.
  return <TestEditorForm key={test.id} test={test} collection={collection} />;
}
