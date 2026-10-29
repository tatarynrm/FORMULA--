'use client';

import { type AdminSubtopic, type Material, type MaterialKind, UPLOADS } from '@formula/shared';
import {
  Download,
  ExternalLink,
  FileSpreadsheet,
  FileText,
  Trash2,
  Upload,
  Video,
  SquarePen,
  type LucideIcon,
} from 'lucide-react';
import { useState } from 'react';

import { DragHandle } from '@/components/common/sortable/drag-handle';
import { SortableList } from '@/components/common/sortable/sortable-list';
import { Button, buttonVariants } from '@/components/ui/button';
import { FileUploadButton } from '@/features/files/components/file-upload-button';
import { fileUrl, formatFileSize } from '@/lib/files';
import { format } from '@/lib/format';
import { t } from '@/locales';

import { useActionNotice } from '../hooks/use-action-notice';
import { useSubtopicMutations } from '../hooks/use-subtopic';
import { ConfirmDialog } from './confirm-dialog';
import { ErrorNotice } from './error-notice';
import { SectionCard } from './section-card';
import { TextFieldDialog } from './text-field-dialog';

const EXCEL_TYPES: readonly string[] = [
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
];

function materialIcon(material: Material): LucideIcon {
  if (material.kind === 'video') return Video;
  return EXCEL_TYPES.includes(material.mimeType) ? FileSpreadsheet : FileText;
}

/** "lesson.final.mp4" -> "lesson.final": the file name makes a decent first title. */
function stripExtension(name: string): string {
  const dot = name.lastIndexOf('.');
  return dot > 0 ? name.slice(0, dot) : name;
}

function extensionLabel(fileName: string): string | null {
  const dot = fileName.lastIndexOf('.');
  return dot > 0 && dot < fileName.length - 1 ? fileName.slice(dot + 1).toUpperCase() : null;
}

/**
 * Videos (the file itself, not a link) and documents (PDF, Word, Excel) of a subtopic. A chosen
 * file is uploaded with a progress indicator and then attached as a material.
 */
export function SubtopicMaterials({ subtopic }: { subtopic: AdminSubtopic }) {
  const copy = t.adminContent.subtopicEditor.materials;
  const { addMaterial, renameMaterial, removeMaterial, reorderMaterials } = useSubtopicMutations(
    subtopic.id,
  );
  const { notice, run } = useActionNotice();
  const [renaming, setRenaming] = useState<Material | null>(null);
  const [toDelete, setToDelete] = useState<Material | null>(null);

  function attach(kind: MaterialKind, file: { id: string; name: string }) {
    void run(
      () => addMaterial.mutateAsync({ kind, title: stripExtension(file.name), fileId: file.id }),
      copy.addError,
    );
  }

  return (
    <SectionCard
      title={copy.title}
      description={format(copy.hint, {
        video: formatFileSize(UPLOADS.video.maxBytes),
        document: formatFileSize(UPLOADS.document.maxBytes),
      })}
      actions={
        <>
          <FileUploadButton
            purpose="video"
            disabled={addMaterial.isPending}
            onUploaded={(file) => attach('video', file)}
          >
            <Upload />
            {copy.uploadVideo}
          </FileUploadButton>
          <FileUploadButton
            purpose="document"
            disabled={addMaterial.isPending}
            onUploaded={(file) => attach('document', file)}
          >
            <Upload />
            {copy.uploadDocument}
          </FileUploadButton>
        </>
      }
    >
      <ErrorNotice message={notice} />
      {addMaterial.isPending ? (
        <p role="status" className="text-body-sm text-text-secondary">
          {copy.adding}
        </p>
      ) : null}

      {subtopic.materials.length === 0 ? (
        <div className="border-border bg-background rounded-2xl border border-dashed px-6 py-8 text-center">
          <p className="text-body-md text-foreground font-semibold">{copy.empty}</p>
          <p className="text-body-sm text-muted-foreground mt-1">{copy.emptyHint}</p>
        </div>
      ) : (
        <SortableList
          as="ul"
          items={subtopic.materials}
          className="flex flex-col gap-2"
          overlayClassName="rounded-2xl"
          aria-label={copy.title}
          getLabel={(material) => material.title}
          onReorder={(ids) =>
            run(() => reorderMaterials.mutateAsync(ids), t.adminContent.common.reorderError)
          }
          renderItem={(material) => {
            const Icon = materialIcon(material);
            const extension = extensionLabel(material.fileName);
            const isVideo = material.kind === 'video';

            return (
              <div className="bg-secondary border-input flex flex-wrap items-center gap-x-4 gap-y-2 rounded-2xl border p-4">
                <div className="flex shrink-0 items-center gap-2">
                  <DragHandle />
                  <span className="bg-surface-raised text-primary flex size-10 shrink-0 items-center justify-center rounded-xl">
                    <Icon className="size-5" aria-hidden />
                  </span>
                </div>

                <div className="flex min-w-0 flex-1 basis-48 flex-col gap-0.5">
                  <p className="text-body-md text-foreground font-semibold wrap-anywhere">
                    {material.title}
                  </p>
                  <p className="text-body-sm text-muted-foreground wrap-anywhere">
                    {[
                      copy.kinds[material.kind],
                      extension,
                      formatFileSize(material.sizeBytes),
                      material.fileName,
                    ]
                      .filter(Boolean)
                      .join(' · ')}
                  </p>
                </div>

                <div className="ml-auto flex items-center gap-1">
                  {/* A plain link: the api answers with the file (videos stream, documents download). */}
                  <a
                    href={fileUrl(material.fileId)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={buttonVariants({ variant: 'ghost', size: 'sm' })}
                  >
                    {isVideo ? <ExternalLink /> : <Download />}
                    {isVideo ? copy.open : copy.download}
                  </a>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    aria-label={`${copy.rename}: ${material.title}`}
                    title={copy.rename}
                    onClick={() => setRenaming(material)}
                  >
                    <SquarePen />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    aria-label={`${copy.delete}: ${material.title}`}
                    title={copy.delete}
                    onClick={() => setToDelete(material)}
                  >
                    <Trash2 />
                  </Button>
                </div>
              </div>
            );
          }}
        />
      )}

      {renaming ? (
        <TextFieldDialog
          title={copy.renameTitle}
          label={copy.renameLabel}
          initialValue={renaming.title}
          submitLabel={t.adminContent.common.save}
          errorFallback={copy.renameError}
          onSubmit={(title) => renameMaterial.mutateAsync({ id: renaming.id, title })}
          onClose={() => setRenaming(null)}
        />
      ) : null}

      <ConfirmDialog
        open={toDelete !== null}
        onOpenChange={(open) => {
          if (!open) setToDelete(null);
        }}
        title={copy.deleteTitle}
        description={format(copy.deleteDescription, { title: toDelete?.title ?? '' })}
        confirmLabel={t.adminContent.common.delete}
        onConfirm={() => {
          if (toDelete) void run(() => removeMaterial.mutateAsync(toDelete.id), copy.deleteError);
        }}
      />
    </SectionCard>
  );
}
