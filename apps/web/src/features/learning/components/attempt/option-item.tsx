import { Check, X } from 'lucide-react';
import type { ReactNode, Ref } from 'react';

import { cn } from '@/lib/utils';
import { t } from '@/locales';

import { ProtectedImage } from '../protected-image';

/** How an answer option looks: untouched, picked by the student, or marked after the answer is known. */
export type OptionVisualState = 'default' | 'selected' | 'correct' | 'wrong';

const FRAME_CLASSES: Record<OptionVisualState, string> = {
  default: 'bg-secondary border-transparent',
  selected: 'bg-accent border-answer-border',
  correct: 'bg-success-soft border-success',
  wrong: 'bg-danger-soft border-destructive',
};

const LETTER_CLASSES: Record<OptionVisualState, string> = {
  default: 'bg-surface-raised text-muted-foreground',
  selected: 'bg-primary text-primary-foreground',
  correct: 'bg-success text-primary-foreground',
  wrong: 'bg-destructive text-destructive-foreground',
};

interface OptionBodyProps {
  letter: string;
  body: string;
  imageFileId: string | null;
  state: OptionVisualState;
  /** Extra text for screen readers, for example "Правильна відповідь". */
  srText?: string;
  /** Visible tags at the end of the row (result screen). */
  tags?: ReactNode;
}

/** Letter badge, text, optional picture and the right/wrong mark. Shared by the runner and the result. */
export function OptionBody({ letter, body, imageFileId, state, srText, tags }: OptionBodyProps) {
  return (
    <span className="flex w-full items-start gap-3">
      <span
        aria-hidden
        className={cn(
          'text-body-sm flex size-8 shrink-0 items-center justify-center rounded-full font-semibold transition-colors',
          LETTER_CLASSES[state],
        )}
      >
        {letter}
      </span>
      <span className="flex min-w-0 flex-1 flex-col gap-2 pt-1">
        {body ? (
          <span className="text-body-md text-foreground break-words whitespace-pre-wrap">
            {body}
          </span>
        ) : null}
        {imageFileId ? (
          <ProtectedImage
            fileId={imageFileId}
            alt={`${t.learning.attempt.optionImage} ${letter}`}
            className="border-border max-h-64 rounded-xl border"
          />
        ) : null}
        {srText ? <span className="sr-only">{srText}</span> : null}
      </span>
      {tags}
      {state === 'correct' ? (
        <Check className="text-success mt-1 size-5 shrink-0" aria-hidden />
      ) : null}
      {state === 'wrong' ? (
        <X className="text-destructive mt-1 size-5 shrink-0" aria-hidden />
      ) : null}
    </span>
  );
}

interface OptionButtonProps extends OptionBodyProps {
  /** `radio` for a single answer, `checkbox` when several options are right. */
  role: 'radio' | 'checkbox';
  checked: boolean;
  /** The answer is final: the option stays readable and focusable but does nothing. */
  locked: boolean;
  /** Roving focus for radios: only one option is reachable with Tab. */
  tabbable: boolean;
  onSelect: () => void;
  buttonRef?: Ref<HTMLButtonElement>;
}

/** A clickable option with radio or checkbox semantics. Arrow keys are handled by the group. */
export function OptionButton({
  role,
  checked,
  locked,
  tabbable,
  onSelect,
  buttonRef,
  ...body
}: OptionButtonProps) {
  return (
    <button
      ref={buttonRef}
      type="button"
      role={role}
      aria-checked={checked}
      aria-disabled={locked || undefined}
      tabIndex={tabbable ? 0 : -1}
      onClick={() => {
        if (!locked) onSelect();
      }}
      className={cn(
        'focus-visible:ring-ring w-full rounded-2xl border p-3 text-left transition-colors outline-none focus-visible:ring-[3px]',
        FRAME_CLASSES[body.state],
        locked ? 'cursor-default' : 'hover:border-answer-border hover:bg-accent cursor-pointer',
      )}
    >
      <OptionBody {...body} />
    </button>
  );
}

/** A read-only option (result screen). */
export function OptionRow(props: OptionBodyProps) {
  return (
    <div className={cn('rounded-2xl border p-3', FRAME_CLASSES[props.state])}>
      <OptionBody {...props} />
    </div>
  );
}
