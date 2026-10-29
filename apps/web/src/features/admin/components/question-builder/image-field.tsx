'use client';

import { ImagePlus, Trash2 } from 'lucide-react';

import { FileImage } from '@/components/common/file-image';
import { Button } from '@/components/ui/button';
import { FileUploadButton } from '@/features/files/components/file-upload-button';
import { cn } from '@/lib/utils';
import { t } from '@/locales';

interface ImageFieldProps {
  /** Id of the uploaded image, or `null` when there is none. */
  fileId: string | null;
  /** Visible name of the field, e.g. "Зображення до питання (необов’язково)". */
  label: string;
  /** Alt text of the preview. */
  alt: string;
  onChange: (fileId: string | null) => void;
  /** A smaller preview, used for answer options. */
  compact?: boolean;
}

/** Optional picture of a question or an answer option: upload, preview, replace, remove. */
export function ImageField({ fileId, label, alt, onChange, compact = false }: ImageFieldProps) {
  const copy = t.adminContent.questions;

  return (
    <div className="flex flex-col gap-2">
      <span className="text-body-sm text-text-secondary font-medium">{label}</span>

      {fileId ? (
        <div className="border-input bg-surface-soft w-fit max-w-full overflow-hidden rounded-xl border">
          <FileImage
            fileId={fileId}
            alt={alt}
            className={cn('object-contain', compact ? 'max-h-32' : 'max-h-56')}
          />
        </div>
      ) : null}

      <div className="flex flex-wrap items-start gap-2">
        <FileUploadButton purpose="image" size="sm" onUploaded={(file) => onChange(file.id)}>
          <ImagePlus />
          {fileId ? copy.replaceImage : copy.addImage}
        </FileUploadButton>
        {fileId ? (
          <Button type="button" variant="ghost" size="sm" onClick={() => onChange(null)}>
            <Trash2 />
            {copy.removeImage}
          </Button>
        ) : null}
      </div>
    </div>
  );
}
