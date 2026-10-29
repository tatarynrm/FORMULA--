'use client';

import { ChevronLeft, ChevronRight } from 'lucide-react';
import { type KeyboardEvent, useEffect, useRef, useState } from 'react';

import { Button } from '@/components/ui/button';
import { format } from '@/lib/format';
import { cn } from '@/lib/utils';
import { t } from '@/locales';

import { JUMP_FIELD_MIN_QUESTIONS } from '../../constants';

/** What the student knows about a question: nothing yet, left behind, answered, or (explanation mode) graded. */
export type ChipState = 'unanswered' | 'skipped' | 'answered' | 'correct' | 'wrong';

const CHIP_STYLES: Record<ChipState, string> = {
  unanswered: 'bg-background text-muted-foreground hover:bg-accent',
  skipped:
    'border-answer-border text-muted-foreground hover:bg-accent border-dashed bg-transparent',
  answered: 'border-primary/40 bg-primary/10 text-primary',
  correct: 'border-success bg-success-soft text-success',
  wrong: 'border-destructive bg-danger-soft text-destructive',
};

interface QuestionNavigatorProps {
  /** One state per question, in order. */
  states: readonly ChipState[];
  /** Index of the question on screen. */
  current: number;
  onSelect: (index: number) => void;
}

/** "Go to question" field: shows the current number and jumps to the typed one (Figma "1 / 150"). */
function JumpField({
  current,
  total,
  onSelect,
}: {
  current: number;
  total: number;
  onSelect: (index: number) => void;
}) {
  const copy = t.learning.attempt;
  const [draft, setDraft] = useState<string | null>(null);
  const cancelledRef = useRef(false);

  // The number is applied when the field loses focus (Enter just leaves it); Escape leaves without applying.
  function commit() {
    const number = Number(draft);
    if (!cancelledRef.current && draft !== null && Number.isInteger(number) && number >= 1) {
      onSelect(Math.min(number, total) - 1);
    }
    cancelledRef.current = false;
    setDraft(null);
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'Enter') {
      event.preventDefault();
      event.currentTarget.blur();
    }
    if (event.key === 'Escape') {
      cancelledRef.current = true;
      event.currentTarget.blur();
    }
  }

  return (
    <div className="bg-surface-raised text-body-sm text-muted-foreground flex h-9 shrink-0 items-center gap-1.5 rounded-xl px-2">
      <input
        type="text"
        inputMode="numeric"
        pattern="[0-9]*"
        aria-label={copy.jumpLabel}
        value={draft ?? String(current + 1)}
        onFocus={(event) => {
          setDraft(String(current + 1));
          event.currentTarget.select();
        }}
        onChange={(event) => setDraft(event.target.value.replace(/\D/g, '').slice(0, 4))}
        onBlur={commit}
        onKeyDown={handleKeyDown}
        className="text-foreground focus-visible:ring-ring w-10 rounded-md bg-transparent text-center font-semibold outline-none focus-visible:ring-[3px]"
      />
      <span aria-hidden>{format(copy.counter, { total })}</span>
    </div>
  );
}

/**
 * Numbered chips for every question (Figma "question-nav"): the current one is pink, answered ones are
 * outlined, skipped ones dashed, and in explanation mode right and wrong answers are green and red.
 */
export function QuestionNavigator({ states, current, onSelect }: QuestionNavigatorProps) {
  const copy = t.learning.attempt;
  const currentRef = useRef<HTMLButtonElement>(null);
  const total = states.length;

  // Long tests scroll sideways: keep the current chip in view.
  useEffect(() => {
    currentRef.current?.scrollIntoView({ block: 'nearest', inline: 'center' });
  }, [current]);

  return (
    <nav aria-label={copy.navLabel} className="flex items-center gap-2">
      {total > JUMP_FIELD_MIN_QUESTIONS ? (
        // On a phone the chips scroll sideways and need the room; the field is for wider screens.
        <div className="hidden sm:block">
          <JumpField current={current} total={total} onSelect={onSelect} />
        </div>
      ) : null}

      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        aria-label={copy.previousQuestion}
        disabled={current === 0}
        onClick={() => onSelect(current - 1)}
        className="shrink-0"
      >
        <ChevronLeft aria-hidden />
      </Button>

      <ol className="flex min-w-0 flex-1 scrollbar-none gap-2 overflow-x-auto p-1">
        {states.map((state, index) => {
          const isCurrent = index === current;
          const stateLabel = isCurrent ? copy.chipStates.current : copy.chipStates[state];

          return (
            <li key={index} className="shrink-0">
              <button
                ref={isCurrent ? currentRef : undefined}
                type="button"
                aria-current={isCurrent ? 'step' : undefined}
                aria-label={format(copy.chip, { n: index + 1, state: stateLabel })}
                onClick={() => onSelect(index)}
                className={cn(
                  'text-body-sm focus-visible:ring-ring size-9 rounded-xl border border-transparent font-medium transition-colors outline-none focus-visible:ring-[3px]',
                  isCurrent
                    ? 'border-primary bg-primary text-primary-foreground'
                    : CHIP_STYLES[state],
                )}
              >
                {index + 1}
              </button>
            </li>
          );
        })}
      </ol>

      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        aria-label={copy.nextQuestion}
        disabled={current >= total - 1}
        onClick={() => onSelect(current + 1)}
        className="shrink-0"
      >
        <ChevronRight aria-hidden />
      </Button>
    </nav>
  );
}
