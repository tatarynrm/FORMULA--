import { cn } from '@/lib/utils';

interface ErrorNoticeProps {
  /** Nothing is rendered while there is no message. */
  message: string | null | undefined;
  className?: string;
}

/** Inline error box. `role="alert"` makes screen readers announce it when it appears. */
export function ErrorNotice({ message, className }: ErrorNoticeProps) {
  if (!message) return null;

  return (
    <p
      role="alert"
      className={cn(
        'bg-input-error-bg border-input-error-border text-input-error-text text-body-sm rounded-2xl border px-4 py-3',
        className,
      )}
    >
      {message}
    </p>
  );
}
