'use client';

import type { Material, StudentSubtopic } from '@formula/shared';
import { Download, FileSpreadsheet, FileText } from 'lucide-react';
import type { MouseEvent } from 'react';

import { EmptyState } from '@/components/common/empty-state';
import { RichTextContent } from '@/components/common/rich-text/rich-text-content';
import { formatFileSize, fileUrl } from '@/lib/files';
import { cn } from '@/lib/utils';
import { t } from '@/locales';

import { type DocumentKind, getDocumentKind } from '../../utils/documents';
import { ensureFreshSession } from '../../utils/session';
import { ProtectedVideo } from '../protected-video';

const DOCUMENT_ICONS: Record<DocumentKind, typeof FileText> = {
  pdf: FileText,
  word: FileText,
  excel: FileSpreadsheet,
  other: FileText,
};

function DocumentCard({ material }: { material: Material }) {
  const copy = t.learning.subtopic.materials;
  const kind = getDocumentKind(material.mimeType);
  const Icon = DOCUMENT_ICONS[kind];
  const url = fileUrl(material.fileId);

  // A long reading session can outlive the session cookie that the download request uses, so it is renewed first.
  async function download(event: MouseEvent<HTMLAnchorElement>) {
    event.preventDefault();
    await ensureFreshSession();
    window.open(url, '_blank', 'noopener');
  }

  return (
    <a
      href={url}
      download={material.fileName}
      target="_blank"
      rel="noopener noreferrer"
      onClick={(event) => void download(event)}
      className="bg-surface-raised border-input hover:border-primary focus-visible:ring-ring flex items-center gap-4 rounded-2xl border p-4 transition-colors outline-none focus-visible:ring-[3px]"
    >
      <span className="bg-primary/10 text-primary flex size-12 shrink-0 items-center justify-center rounded-xl">
        <Icon className="size-6" aria-hidden />
      </span>
      <span className="flex min-w-0 flex-1 flex-col">
        <span className="text-body-md text-foreground font-semibold break-words">
          {material.title}
        </span>
        <span className="text-body-xs text-muted-foreground">
          {copy.documentKinds[kind]} · {formatFileSize(material.sizeBytes)}
        </span>
      </span>
      <span className="text-primary text-body-sm flex shrink-0 items-center gap-1.5 font-semibold">
        <Download className="size-5" aria-hidden />
        <span className="hidden sm:inline">{copy.download}</span>
        <span className="sr-only sm:hidden">{copy.download}</span>
      </span>
    </a>
  );
}

/** The "Матеріали" tab: the description written in the editor, the videos and the documents of a subtopic. */
export function SubtopicMaterials({ subtopic }: { subtopic: StudentSubtopic }) {
  const copy = t.learning.subtopic.materials;
  const videos = subtopic.materials.filter((material) => material.kind === 'video');
  const documents = subtopic.materials.filter((material) => material.kind === 'document');
  const hasDescription = subtopic.descriptionHtml.trim() !== '';

  if (!hasDescription && videos.length === 0 && documents.length === 0) {
    return <EmptyState title={copy.emptyTitle} description={copy.emptyDescription} />;
  }

  return (
    <div className="flex flex-col gap-8">
      {hasDescription ? (
        <section className="bg-surface-raised border-input rounded-2xl border p-5 md:p-6">
          <RichTextContent html={subtopic.descriptionHtml} />
        </section>
      ) : null}

      {videos.length > 0 ? (
        <section aria-labelledby="materials-videos" className="flex flex-col gap-4">
          <h2 id="materials-videos" className="text-h3 text-foreground">
            {copy.videosHeading}
          </h2>
          <ul className={cn('grid gap-4', videos.length === 1 ? 'max-w-3xl' : 'lg:grid-cols-2')}>
            {videos.map((video) => (
              <li
                key={video.id}
                className="bg-surface-raised border-input flex flex-col gap-3 rounded-2xl border p-4"
              >
                <ProtectedVideo fileId={video.fileId} title={video.title} />
                <p className="text-body-md text-foreground font-semibold break-words">
                  {video.title}
                </p>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {documents.length > 0 ? (
        <section aria-labelledby="materials-documents" className="flex flex-col gap-4">
          <h2 id="materials-documents" className="text-h3 text-foreground">
            {copy.documentsHeading}
          </h2>
          <ul className="grid gap-3 md:grid-cols-2">
            {documents.map((document) => (
              <li key={document.id}>
                <DocumentCard material={document} />
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}
