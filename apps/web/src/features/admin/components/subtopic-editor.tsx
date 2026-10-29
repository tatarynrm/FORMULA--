'use client';

import type { AdminSubtopic } from '@formula/shared';
import { ChevronRight, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { EmptyState } from '@/components/common/empty-state';
import { LinkButton } from '@/components/common/link-button';
import { LogoLoader } from '@/components/common/logo-loader';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { format } from '@/lib/format';
import { t } from '@/locales';

import { useActionNotice } from '../hooks/use-action-notice';
import { useSubtopic, useSubtopicMutations } from '../hooks/use-subtopic';
import { isApiStatus } from '../utils/api-error';
import { AdminPageHeader } from './admin-page-header';
import { ConfirmDialog } from './confirm-dialog';
import { ErrorNotice } from './error-notice';
import { FreeSubtopicSwitch } from './free-subtopic-switch';
import { PageTitle } from './page-title';
import { SectionCard } from './section-card';
import { StatusBadge } from './status-badge';
import { StatusToggleButton } from './status-toggle-button';
import { SubtopicDescription } from './subtopic-description';
import { SubtopicMaterials } from './subtopic-materials';
import { SubtopicTests } from './subtopic-tests';
import { TextFieldDialog } from './text-field-dialog';

/** Subject > topic trail above the title of a subtopic. */
function Breadcrumb({ subtopic }: { subtopic: AdminSubtopic }) {
  return (
    <nav aria-label={t.adminContent.subtopicEditor.breadcrumb}>
      <ol className="text-body-sm text-muted-foreground flex flex-wrap items-center gap-1.5">
        <li>
          <Link href="/admin" className="hover:text-primary transition-colors">
            {t.adminContent.subtopicEditor.root}
          </Link>
        </li>
        <li aria-hidden>
          <ChevronRight className="size-4" />
        </li>
        <li>
          <Link
            href={`/admin/subjects/${subtopic.subjectId}`}
            className="hover:text-primary transition-colors"
          >
            {subtopic.subjectTitle}
          </Link>
        </li>
        <li aria-hidden>
          <ChevronRight className="size-4" />
        </li>
        <li aria-current="page" className="text-text-secondary">
          {subtopic.topicTitle}
        </li>
      </ol>
    </nav>
  );
}

function SubtopicView({ subtopic }: { subtopic: AdminSubtopic }) {
  const copy = t.adminContent;
  const router = useRouter();
  const { update, remove } = useSubtopicMutations(subtopic.id);
  const { notice, run } = useActionNotice();
  const [renaming, setRenaming] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const backHref = `/admin/subjects/${subtopic.subjectId}`;

  return (
    <div className="flex max-w-5xl flex-col gap-6">
      <Breadcrumb subtopic={subtopic} />

      <AdminPageHeader
        backHref={backHref}
        title={
          <PageTitle onEdit={() => setRenaming(true)} editLabel={copy.subtopics.renameTitle}>
            {subtopic.title}
          </PageTitle>
        }
      />

      <div className="flex flex-wrap items-center gap-3">
        <StatusBadge status={subtopic.status} />
        <Badge variant={subtopic.isFree ? 'brand' : 'secondary'}>
          {subtopic.isFree ? copy.subtopics.free : copy.subtopics.paid}
        </Badge>
        <StatusToggleButton
          status={subtopic.status}
          disabled={update.isPending}
          onToggle={(next) =>
            void run(() => update.mutateAsync({ status: next }), copy.subtopicEditor.publishError)
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
          {copy.subtopics.delete}
        </Button>
        <p className="text-body-sm text-muted-foreground">
          {subtopic.status === 'published'
            ? copy.subtopicEditor.publishedHint
            : copy.subtopicEditor.draftHint}
        </p>
      </div>

      <ErrorNotice message={notice} />

      <SectionCard title={copy.subtopicEditor.settings}>
        <FreeSubtopicSwitch
          checked={subtopic.isFree}
          disabled={update.isPending}
          hint={copy.subtopicEditor.freeHint}
          onCheckedChange={(isFree) =>
            void run(() => update.mutateAsync({ isFree }), copy.subtopicEditor.updateError)
          }
        />
      </SectionCard>

      <SubtopicDescription subtopic={subtopic} />
      <SubtopicMaterials subtopic={subtopic} />
      <SubtopicTests subtopicId={subtopic.id} />

      {renaming ? (
        <TextFieldDialog
          title={copy.subtopics.renameTitle}
          label={copy.subtopics.label}
          initialValue={subtopic.title}
          submitLabel={copy.common.save}
          errorFallback={copy.subtopics.renameError}
          onSubmit={(title) => update.mutateAsync({ title })}
          onClose={() => setRenaming(false)}
        />
      ) : null}

      <ConfirmDialog
        open={confirmDelete}
        onOpenChange={setConfirmDelete}
        title={copy.subtopics.deleteTitle}
        description={format(copy.subtopics.deleteDescription, { title: subtopic.title })}
        confirmLabel={copy.common.delete}
        requireText={{ value: subtopic.title, kind: copy.common.typeToConfirm.kinds.title }}
        onConfirm={() =>
          void run(async () => {
            await remove.mutateAsync();
            router.replace(backHref);
          }, copy.subtopicEditor.deleteError)
        }
      />
    </div>
  );
}

/** One subtopic: status and access, rich text description, materials and tests. */
export function SubtopicEditor({ id }: { id: string }) {
  const copy = t.adminContent.subtopicEditor;
  const { data: subtopic, isPending, isError, error } = useSubtopic(id);

  if (isError) {
    return (
      <div className="flex flex-col gap-6">
        <AdminPageHeader title={t.admin.subjects.title} backHref="/admin" />
        <EmptyState
          title={isApiStatus(error, 404) ? copy.notFound : copy.loadError}
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

  // Keyed by id: the description editor copies the loaded text once, for this subtopic only.
  return <SubtopicView key={subtopic.id} subtopic={subtopic} />;
}
