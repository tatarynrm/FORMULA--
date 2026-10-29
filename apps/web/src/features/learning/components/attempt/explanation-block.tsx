interface ExplanationBlockProps {
  /** Letter of the option the explanation belongs to. Without it the block explains the whole question. */
  letter?: string;
  title?: string;
  text: string;
  /** What a screen reader says first, for example "Пояснення до варіанта B". */
  srLabel?: string;
}

/** Pink note with the explanation of an option or of the whole question (Figma "answer explanation"). */
export function ExplanationBlock({ letter, title, text, srLabel }: ExplanationBlockProps) {
  return (
    <div className="bg-primary/10 flex items-start gap-3 rounded-2xl p-4">
      {letter ? (
        <span
          aria-hidden
          className="bg-surface-raised text-muted-foreground text-body-sm flex size-8 shrink-0 items-center justify-center rounded-full font-semibold"
        >
          {letter}
        </span>
      ) : null}
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        {title ? <p className="text-body-sm text-foreground font-semibold">{title}</p> : null}
        <p className="text-body-md text-foreground break-words whitespace-pre-wrap">
          {srLabel ? <span className="sr-only">{srLabel}. </span> : null}
          {text}
        </p>
      </div>
    </div>
  );
}
