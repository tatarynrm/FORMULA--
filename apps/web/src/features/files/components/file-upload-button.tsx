'use client';

import { type FilePurpose, UPLOADS, type UploadedFile } from '@formula/shared';
import { Loader2 } from 'lucide-react';
import { type ReactNode, useRef, useState } from 'react';

import { Button } from '@/components/ui/button';
import { formatFileSize } from '@/lib/files';
import { cn } from '@/lib/utils';
import { format } from '@/lib/format';
import { t } from '@/locales';

import { uploadFile } from '../api/upload-file';

interface FileUploadButtonProps {
  purpose: FilePurpose;
  /** Called with the stored file once the upload finished. */
  onUploaded: (file: UploadedFile) => void;
  children: ReactNode;
  variant?: 'default' | 'secondary' | 'ghost';
  size?: 'default' | 'sm';
  disabled?: boolean;
  className?: string;
}

/**
 * A button that opens the file picker and uploads the chosen file with a progress indicator.
 * Size and type are checked in the browser first, with the same limits the api enforces
 * (`UPLOADS` in `@formula/shared`).
 */
export function FileUploadButton({
  purpose,
  onUploaded,
  children,
  variant = 'secondary',
  size = 'default',
  disabled,
  className,
}: FileUploadButtonProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const abortRef = useRef<AbortController | null>(null);
  const [progress, setProgress] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const rules = UPLOADS[purpose];
  const uploading = progress !== null;

  async function handleFile(file: File) {
    setError(null);

    if (!(rules.mimeTypes as readonly string[]).includes(file.type)) {
      setError(t.files.wrongType);
      return;
    }
    if (file.size > rules.maxBytes) {
      setError(format(t.files.tooLarge, { max: formatFileSize(rules.maxBytes) }));
      return;
    }

    const controller = new AbortController();
    abortRef.current = controller;
    setProgress(0);

    try {
      onUploaded(
        await uploadFile({ file, purpose, onProgress: setProgress, signal: controller.signal }),
      );
    } catch (caught) {
      // A cancelled upload is not an error to show.
      if (!(caught instanceof DOMException && caught.name === 'AbortError'))
        setError(t.files.failed);
    } finally {
      abortRef.current = null;
      setProgress(null);
      // Allows choosing the same file again.
      if (inputRef.current) inputRef.current.value = '';
    }
  }

  return (
    <div className={cn('flex flex-col items-start gap-2', className)}>
      <input
        ref={inputRef}
        type="file"
        accept={rules.mimeTypes.join(',')}
        hidden
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) void handleFile(file);
        }}
      />

      {uploading ? (
        <div className="flex items-center gap-3">
          <span role="status" className="text-body-sm text-text-secondary flex items-center gap-2">
            <Loader2 className="size-4 animate-spin" aria-hidden />
            {format(t.files.uploading, { percent: progress })}
          </span>
          <Button type="button" variant="ghost" size="sm" onClick={() => abortRef.current?.abort()}>
            {t.files.cancel}
          </Button>
        </div>
      ) : (
        <Button
          type="button"
          variant={variant}
          size={size}
          disabled={disabled}
          onClick={() => inputRef.current?.click()}
        >
          {children}
        </Button>
      )}

      {error ? (
        <p role="alert" className="text-body-sm text-input-error-text">
          {error}
        </p>
      ) : null}
    </div>
  );
}
