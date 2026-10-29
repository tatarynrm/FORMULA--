'use client';

import { CHAT, type SendChatMessageInput, UPLOADS } from '@formula/shared';
import { ImagePlus, Loader2, SendHorizontal, X } from 'lucide-react';
import {
  type ChangeEvent,
  type ClipboardEvent,
  type KeyboardEvent,
  useEffect,
  useRef,
  useState,
} from 'react';

import { Button } from '@/components/ui/button';
import { uploadFile } from '@/features/files/api/upload-file';
import { formatFileSize } from '@/lib/files';
import { cn } from '@/lib/utils';
import { format } from '@/lib/format';
import { t } from '@/locales';

/** The counter appears when this many characters are left. */
const COUNTER_FROM = 300;

interface Attachment {
  previewUrl: string;
  progress: number;
  /** Set once the upload finished. */
  fileId: string | null;
  error: string | null;
  controller: AbortController;
}

interface ComposerProps {
  /** Until the thread is loaded nothing can be sent. */
  disabled?: boolean;
  onSend: (input: SendChatMessageInput) => void;
  onTyping: () => void;
}

/**
 * The message box: a text area that grows up to six lines, a picture (chosen or pasted, uploaded
 * at once with progress), Enter to send and Shift+Enter for a new line.
 */
export function Composer({ disabled = false, onSend, onTyping }: ComposerProps) {
  const copy = t.chat.composer;
  const rules = UPLOADS.chat;
  const [text, setText] = useState('');
  const [attachment, setAttachment] = useState<Attachment | null>(null);
  const [error, setError] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const attachmentRef = useRef<Attachment | null>(null);
  useEffect(() => {
    attachmentRef.current = attachment;
  });

  const uploading = attachment !== null && attachment.fileId === null && attachment.error === null;
  const imageReady = typeof attachment?.fileId === 'string';
  const hasContent = text.trim().length > 0 || imageReady;
  const canSend = !disabled && !uploading && hasContent;
  const remaining = CHAT.MESSAGE_MAX_LENGTH - text.length;

  // Browsers without `field-sizing: content` get the same growth from the scroll height.
  const fitHeight = () => {
    const textarea = textareaRef.current;
    if (!textarea || CSS.supports('field-sizing', 'content')) return;
    textarea.style.height = 'auto';
    textarea.style.height = `${textarea.scrollHeight}px`;
  };

  // Drop the preview URL and any running upload when the composer goes away.
  useEffect(
    () => () => {
      const current = attachmentRef.current;
      if (current) {
        current.controller.abort();
        URL.revokeObjectURL(current.previewUrl);
      }
    },
    [],
  );

  function clearAttachment() {
    const current = attachmentRef.current;
    if (!current) return;
    current.controller.abort();
    URL.revokeObjectURL(current.previewUrl);
    setAttachment(null);
  }

  async function attach(file: File) {
    setError(null);
    if (!(rules.mimeTypes as readonly string[]).includes(file.type)) {
      setError(t.files.wrongType);
      return;
    }
    if (file.size > rules.maxBytes) {
      setError(format(t.files.tooLarge, { max: formatFileSize(rules.maxBytes) }));
      return;
    }

    clearAttachment();
    const controller = new AbortController();
    const next: Attachment = {
      previewUrl: URL.createObjectURL(file),
      progress: 0,
      fileId: null,
      error: null,
      controller,
    };
    setAttachment(next);
    const update = (patch: Partial<Attachment>) =>
      setAttachment((current) =>
        current && current.controller === controller ? { ...current, ...patch } : current,
      );

    try {
      const uploaded = await uploadFile({
        file,
        purpose: 'chat',
        signal: controller.signal,
        onProgress: (progress) => update({ progress }),
      });
      update({ fileId: uploaded.id, progress: 100 });
    } catch (caught) {
      if (caught instanceof DOMException && caught.name === 'AbortError') return;
      update({ error: t.files.failed });
    }
  }

  function submit() {
    if (!canSend) return;
    const body = text.trim();
    onSend({
      body: body || undefined,
      imageFileId: attachment?.fileId ?? undefined,
    });
    setText('');
    const current = attachmentRef.current;
    if (current) URL.revokeObjectURL(current.previewUrl);
    setAttachment(null);
    setError(null);
    requestAnimationFrame(() => {
      fitHeight();
      textareaRef.current?.focus();
    });
  }

  const handleChange = (event: ChangeEvent<HTMLTextAreaElement>) => {
    setText(event.target.value);
    fitHeight();
    if (event.target.value.trim()) onTyping();
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key !== 'Enter' || event.shiftKey || event.nativeEvent.isComposing) return;
    event.preventDefault();
    submit();
  };

  const handlePaste = (event: ClipboardEvent<HTMLTextAreaElement>) => {
    const file = Array.from(event.clipboardData.files).find((candidate) =>
      candidate.type.startsWith('image/'),
    );
    if (!file) return;
    event.preventDefault();
    void attach(file);
  };

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        submit();
      }}
      className="border-border bg-card flex flex-col gap-2 border-t p-3 md:p-4"
    >
      {attachment ? (
        <div className="bg-surface-raised border-border flex items-center gap-3 self-start rounded-xl border p-2 pr-3">
          {/* eslint-disable-next-line @next/next/no-img-element -- a local preview of the chosen file */}
          <img
            src={attachment.previewUrl}
            alt={copy.previewAlt}
            className="size-14 rounded-lg object-cover"
          />
          <div className="text-body-xs flex min-w-0 flex-col gap-1">
            {attachment.error ? (
              <span role="alert" className="text-input-error-text">
                {attachment.error}
              </span>
            ) : attachment.fileId ? null : (
              <span role="status" className="text-muted-foreground flex items-center gap-1.5">
                <Loader2 className="size-3.5 animate-spin" aria-hidden />
                {format(copy.uploading, { percent: attachment.progress })}
              </span>
            )}
            {!attachment.error && !attachment.fileId ? (
              <span className="bg-progress-track h-1.5 w-32 overflow-hidden rounded-full">
                <span
                  className="bg-primary block h-full rounded-full transition-[width]"
                  style={{ width: `${attachment.progress}%` }}
                />
              </span>
            ) : null}
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            aria-label={copy.removeImage}
            onClick={clearAttachment}
          >
            <X className="size-4" />
          </Button>
        </div>
      ) : null}

      <div className="flex items-end gap-2">
        <input
          ref={fileInputRef}
          type="file"
          accept={rules.mimeTypes.join(',')}
          hidden
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (file) void attach(file);
            event.target.value = '';
          }}
        />
        <Button
          type="button"
          variant="ghost"
          size="icon-lg"
          aria-label={copy.attachImage}
          disabled={disabled || uploading}
          onClick={() => fileInputRef.current?.click()}
          className="text-muted-foreground hover:text-primary shrink-0"
        >
          <ImagePlus />
        </Button>

        <textarea
          ref={textareaRef}
          rows={1}
          value={text}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          onPaste={handlePaste}
          placeholder={copy.placeholder}
          aria-label={copy.label}
          maxLength={CHAT.MESSAGE_MAX_LENGTH}
          disabled={disabled}
          autoComplete="off"
          className={cn(
            'bg-surface-raised border-input text-body-md text-foreground placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 disabled:bg-input-disabled-bg field-sizing-content max-h-40 min-h-12 min-w-0 flex-1 resize-none rounded-3xl border px-4 py-3 transition-shadow outline-none focus-visible:ring-[3px]',
          )}
        />

        <Button
          type="submit"
          size="icon-lg"
          aria-label={copy.send}
          disabled={!canSend}
          className="shrink-0"
        >
          <SendHorizontal />
        </Button>
      </div>

      <div className="text-body-xs text-muted-foreground flex min-h-4 items-center justify-between gap-3 px-1">
        <span className="hidden md:inline">{copy.hint}</span>
        {remaining <= COUNTER_FROM ? (
          <span
            role="status"
            className={cn('ml-auto tabular-nums', remaining <= 0 && 'text-input-error-text')}
          >
            {format(copy.counter, { count: text.length, max: CHAT.MESSAGE_MAX_LENGTH })}
          </span>
        ) : null}
      </div>

      {error ? (
        <p role="alert" className="text-body-sm text-input-error-text px-1">
          {error}
        </p>
      ) : null}
    </form>
  );
}
