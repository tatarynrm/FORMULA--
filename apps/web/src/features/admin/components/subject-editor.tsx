'use client';

import { Plus, Trash2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { EmptyState } from '@/components/common/empty-state';
import { LinkButton } from '@/components/common/link-button';
import { LogoLoader } from '@/components/common/logo-loader';
import { Button } from '@/components/ui/button';
import { format } from '@/lib/format';
import { t } from '@/locales';

import { useActionNotice } from '../hooks/use-action-notice';
import { useSubject, useSubjectMutations, useTopicMutations } from '../hooks/use-subjects';
import { isApiStatus } from '../utils/api-error';
import { AdminPageHeader } from './admin-page-header';
import { ConfirmDialog } from './confirm-dialog';
import { ErrorNotice } from './error-notice';
import { PageTitle } from './page-title';
import { StatusBadge } from './status-badge';
import { StatusToggleButton } from './status-toggle-button';
import { SubjectDialog } from './subject-dialog';
import { TextFieldDialog } from './text-field-dialog';
import { TopicTree } from './topic-tree';

type OpenDialog = 'edit' | 'add-topic';

/** One subject: its title, status, description and the tree of topics and subtopics. */
export function SubjectEditor({ id }: { id: string }) {
  const copy = t.adminContent;
  const router = useRouter();
  const { data: subject, isPending, isError, error } = useSubject(id);
  const { update, remove } = useSubjectMutations();
  const { createTopic } = useTopicMutations();
  const { notice, run } = useActionNotice();
  const [dialog, setDialog] = useState<OpenDialog | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);

  if (isError) {
    return (
      <div className="flex flex-col gap-6">
        <AdminPageHeader title={t.admin.subjects.title} backHref="/admin" />
        <EmptyState
          title={isApiStatus(error, 404) ? copy.subject.notFound : copy.subject.loadError}
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

  return (
    <div className="flex flex-col gap-6">
      <AdminPageHeader
        backHref="/admin"
        title={
          <PageTitle onEdit={() => setDialog('edit')} editLabel={copy.subject.edit}>
            {subject.title}
          </PageTitle>
        }
        actions={
          <Button onClick={() => setDialog('add-topic')}>
            <Plus />
            {copy.topics.add}
          </Button>
        }
      />

      <div className="flex flex-wrap items-center gap-3">
        <StatusBadge status={subject.status} />
        <StatusToggleButton
          status={subject.status}
          disabled={update.isPending}
          onToggle={(next) =>
            void run(
              () => update.mutateAsync({ id, patch: { status: next } }),
              copy.subject.publishError,
            )
          }
        />
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="text-destructive"
          onClick={() => setConfirmDelete(true)}
        >
          <Trash2 />
          {copy.subject.delete}
        </Button>
        <p className="text-body-sm text-muted-foreground">
          {subject.status === 'published' ? copy.subject.publishedHint : copy.subject.draftHint}
        </p>
      </div>

      {subject.description ? (
        <p className="text-body-md text-text-secondary max-w-3xl wrap-anywhere whitespace-pre-line">
          {subject.description}
        </p>
      ) : null}

      <ErrorNotice message={notice} />

      <TopicTree subjectId={id} topics={subject.topics} onAddTopic={() => setDialog('add-topic')} />

      {dialog === 'edit' ? (
        <SubjectDialog subject={subject} onClose={() => setDialog(null)} />
      ) : null}

      {dialog === 'add-topic' ? (
        <TextFieldDialog
          title={copy.topics.addTitle}
          label={copy.topics.label}
          placeholder={copy.topics.placeholder}
          submitLabel={copy.common.add}
          errorFallback={copy.topics.addError}
          onSubmit={(title) => createTopic.mutateAsync({ subjectId: id, title })}
          onClose={() => setDialog(null)}
        />
      ) : null}

      <ConfirmDialog
        open={confirmDelete}
        onOpenChange={setConfirmDelete}
        title={copy.subject.deleteTitle}
        description={format(copy.subject.deleteDescription, { title: subject.title })}
        confirmLabel={copy.subject.deleteConfirm}
        requireText={{ value: subject.title, kind: copy.common.typeToConfirm.kinds.title }}
        onConfirm={() =>
          void run(async () => {
            await remove.mutateAsync(id);
            router.replace('/admin');
          }, copy.subject.deleteError)
        }
      />
    </div>
  );
}
