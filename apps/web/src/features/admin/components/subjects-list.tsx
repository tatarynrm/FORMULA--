'use client';

import { Plus } from 'lucide-react';

import { EmptyState } from '@/components/common/empty-state';
import { LinkButton } from '@/components/common/link-button';
import { LogoLoader } from '@/components/common/logo-loader';
import { DragHandle } from '@/components/common/sortable/drag-handle';
import { SortableList } from '@/components/common/sortable/sortable-list';
import { format, pluralizeUk } from '@/lib/format';
import { t } from '@/locales';

import { useActionNotice } from '../hooks/use-action-notice';
import { useSubjectMutations, useSubjects } from '../hooks/use-subjects';
import { AdminPageHeader } from './admin-page-header';
import { ErrorNotice } from './error-notice';
import { StatusBadge } from './status-badge';

/** Root of the admin panel: every subject with its status and number of topics. */
export function SubjectsList() {
  const copy = t.adminContent.subjects;
  const { title, add, manageTopics } = t.admin.subjects;
  const { data: subjects, isPending, isError } = useSubjects();
  const { reorder } = useSubjectMutations();
  const { notice, run } = useActionNotice();

  const addButton = (
    <LinkButton href="/admin/subjects/new">
      <Plus />
      {add}
    </LinkButton>
  );

  return (
    <div className="flex flex-col gap-6">
      <AdminPageHeader title={title} actions={addButton} />
      <ErrorNotice message={notice} />

      {isError ? (
        <EmptyState title={copy.loadError} />
      ) : isPending ? (
        <LogoLoader size="lg" fill />
      ) : subjects.length === 0 ? (
        <EmptyState title={copy.empty} description={copy.emptyHint} action={addButton} />
      ) : (
        <section aria-label={title}>
          <SortableList
            layout="grid"
            items={subjects}
            className="grid gap-4 md:grid-cols-2"
            overlayClassName="rounded-2xl"
            getLabel={(subject) => subject.title}
            onReorder={(ids) =>
              run(() => reorder.mutateAsync(ids), t.adminContent.common.reorderError)
            }
            renderItem={(subject) => (
              <article className="bg-surface-raised border-input flex h-full flex-col gap-4 rounded-2xl border p-6">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex min-w-0 items-start gap-2">
                    <DragHandle className="-mt-0.5 -ml-2" />
                    <h2 className="text-body-lg text-foreground font-bold wrap-anywhere">
                      {subject.title}
                    </h2>
                  </div>
                  <StatusBadge status={subject.status} className="shrink-0" />
                </div>
                {subject.description ? (
                  <p className="text-body-sm text-text-secondary line-clamp-2">
                    {subject.description}
                  </p>
                ) : null}
                <p className="text-body-sm text-muted-foreground">
                  {subject.topicCount === 0
                    ? copy.noTopics
                    : format('{count} {word}', {
                        count: subject.topicCount,
                        word: pluralizeUk(subject.topicCount, copy.topicsCount),
                      })}
                </p>
                <div className="mt-auto flex">
                  <LinkButton href={`/admin/subjects/${subject.id}`} className="flex-1">
                    {manageTopics}
                  </LinkButton>
                </div>
              </article>
            )}
          />
        </section>
      )}
    </div>
  );
}
