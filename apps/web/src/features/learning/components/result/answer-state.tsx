import { cn } from '@/lib/utils';
import { t } from '@/locales';

import type { AnswerState } from '../../types';

/** Fill, border and text of a question in the answer map and of its status pill. */
export const ANSWER_STATE_STYLES: Record<AnswerState, string> = {
  correct: 'border-success bg-success-soft text-success',
  wrong: 'border-destructive bg-danger-soft text-destructive',
  partial: 'border-primary/40 bg-primary/10 text-primary',
  pending: 'border-accent-blue/40 bg-accent-blue/10 text-accent-blue',
  skipped: 'border-transparent bg-secondary text-muted-foreground',
};

/** Small pill with the verdict on a question: "Правильно", "Неправильно", "Без відповіді"... */
export function AnswerStatePill({ state, label }: { state: AnswerState; label?: string }) {
  return (
    <span
      className={cn(
        'text-body-sm inline-flex shrink-0 items-center rounded-full border px-3 py-1 font-medium whitespace-nowrap',
        ANSWER_STATE_STYLES[state],
      )}
    >
      {label ?? t.learning.result.question.status[state]}
    </span>
  );
}
