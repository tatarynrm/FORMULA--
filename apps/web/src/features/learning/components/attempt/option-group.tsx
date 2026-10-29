'use client';

import type { AnswerFeedback, StudentQuestion } from '@formula/shared';
import { type KeyboardEvent, useRef } from 'react';

import { t } from '@/locales';

import { type OptionVisualState, OptionButton } from './option-item';

interface OptionGroupProps {
  question: StudentQuestion;
  /** Id of the element that names the group (the question text). */
  labelId: string;
  /** Id of the hint that says whether one or several options can be chosen. */
  hintId: string;
  selected: readonly string[];
  /** Explanation mode: set once the answer is final; right and wrong options are then marked. */
  feedback: AnswerFeedback | null;
  /** An answer is being sent, so the options wait. */
  busy: boolean;
  onToggle: (optionId: string) => void;
}

/**
 * The options of one question: radio buttons when one answer is right, checkboxes when several are.
 * They are buttons with radio/checkbox semantics on purpose: in explanation mode a click is a final
 * answer, so arrow keys only move the focus and Space or Enter chooses.
 */
export function OptionGroup({
  question,
  labelId,
  hintId,
  selected,
  feedback,
  busy,
  onToggle,
}: OptionGroupProps) {
  const copy = t.learning.attempt.feedback;
  const refs = useRef<Array<HTMLButtonElement | null>>([]);
  const multiple = question.multiple;
  const locked = feedback !== null || busy;

  const checkedIndex = question.options.findIndex((option) => selected.includes(option.id));
  const tabbableIndex = checkedIndex === -1 ? 0 : checkedIndex;

  function visualState(optionId: string): OptionVisualState {
    if (feedback) {
      if (feedback.correctOptionIds.includes(optionId)) return 'correct';
      return selected.includes(optionId) ? 'wrong' : 'default';
    }
    return selected.includes(optionId) ? 'selected' : 'default';
  }

  function screenReaderText(optionId: string): string | undefined {
    if (!feedback) return undefined;
    const parts: string[] = [];
    if (feedback.correctOptionIds.includes(optionId)) parts.push(copy.right);
    if (selected.includes(optionId)) parts.push(copy.yours);
    return parts.length > 0 ? parts.join('. ') : undefined;
  }

  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (multiple) return;

    const count = question.options.length;
    const current = refs.current.findIndex((element) => element === document.activeElement);
    let next: number;

    switch (event.key) {
      case 'ArrowDown':
      case 'ArrowRight':
        next = (current + 1) % count;
        break;
      case 'ArrowUp':
      case 'ArrowLeft':
        next = (current - 1 + count) % count;
        break;
      case 'Home':
        next = 0;
        break;
      case 'End':
        next = count - 1;
        break;
      default:
        return;
    }

    event.preventDefault();
    refs.current[next]?.focus();
  }

  return (
    <div
      role={multiple ? 'group' : 'radiogroup'}
      aria-labelledby={labelId}
      aria-describedby={hintId}
      aria-busy={busy}
      onKeyDown={handleKeyDown}
      className="flex flex-col gap-3"
    >
      {question.options.map((option, index) => (
        <OptionButton
          key={option.id}
          buttonRef={(element) => {
            refs.current[index] = element;
          }}
          role={multiple ? 'checkbox' : 'radio'}
          checked={selected.includes(option.id)}
          locked={locked}
          tabbable={multiple || index === tabbableIndex}
          onSelect={() => onToggle(option.id)}
          letter={option.letter}
          body={option.body}
          imageFileId={option.imageFileId}
          state={visualState(option.id)}
          srText={screenReaderText(option.id)}
        />
      ))}
    </div>
  );
}
