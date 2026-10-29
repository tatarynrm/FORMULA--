'use client';

import { TESTS } from '@formula/shared';
import { ChevronDown, ChevronUp, Trash2 } from 'lucide-react';
import { type Dispatch, memo, useId } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { format } from '@/lib/format';
import { cn } from '@/lib/utils';
import { t } from '@/locales';

import type { DraftOption } from '../../types';
import type { DraftAction } from '../../utils/question-draft';
import { AdminTextarea } from '../admin-textarea';
import { ImageField } from './image-field';

interface OptionRowProps {
  option: DraftOption;
  /** Zero-based position; it decides the letter (A, B, C...). */
  index: number;
  /** How many options the question has (for the first / last / minimum checks). */
  count: number;
  questionKey: string;
  /** One-based number of the question, used in accessible names. */
  questionNumber: number;
  dispatch: Dispatch<DraftAction>;
}

/**
 * One answer option of a choice question: letter, text, optional picture, explanation and the
 * "correct" checkbox. A correct option is outlined and tinted green so it is easy to spot.
 */
export const OptionRow = memo(function OptionRow({
  option,
  index,
  count,
  questionKey,
  questionNumber,
  dispatch,
}: OptionRowProps) {
  const copy = t.adminContent.questions;
  const letter = TESTS.LETTERS[index] ?? '?';
  const id = useId();
  const headingId = `${id}-heading`;
  const names = { letter, n: questionNumber };

  const patch = (
    changes: Partial<Pick<DraftOption, 'body' | 'imageFileId' | 'explanation' | 'isCorrect'>>,
  ) => dispatch({ type: 'patch-option', questionKey, optionKey: option.key, patch: changes });
  const move = (direction: -1 | 1) =>
    dispatch({ type: 'move-option', questionKey, optionKey: option.key, direction });

  return (
    <li
      role="group"
      aria-labelledby={headingId}
      data-correct={option.isCorrect}
      className={cn(
        'flex flex-col gap-3 rounded-2xl border p-4 transition-colors',
        option.isCorrect ? 'border-success bg-success-soft' : 'border-input bg-secondary',
      )}
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-3">
          <span
            aria-hidden
            className={cn(
              'text-body-md flex size-9 shrink-0 items-center justify-center rounded-full border font-bold',
              option.isCorrect
                ? 'border-success bg-success text-primary-foreground'
                : 'border-input bg-surface-raised text-text-secondary',
            )}
          >
            {letter}
          </span>
          <h5 id={headingId} className="text-body-md text-foreground font-semibold">
            <span className="sr-only">{format(copy.optionGroup, names)}</span>
            <span aria-hidden>{format(copy.optionLetter, names)}</span>
          </h5>
          {option.isCorrect ? (
            <Badge className="bg-success text-primary-foreground">{copy.correctBadge}</Badge>
          ) : null}
        </div>

        <div className="flex items-center gap-1">
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            aria-label={format(copy.moveOptionUp, names)}
            title={format(copy.moveOptionUp, names)}
            disabled={index === 0}
            onClick={() => move(-1)}
          >
            <ChevronUp />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            aria-label={format(copy.moveOptionDown, names)}
            title={format(copy.moveOptionDown, names)}
            disabled={index === count - 1}
            onClick={() => move(1)}
          >
            <ChevronDown />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            aria-label={format(copy.removeOption, names)}
            title={
              count <= TESTS.MIN_OPTIONS
                ? format(copy.minOptions, { min: TESTS.MIN_OPTIONS })
                : format(copy.removeOption, names)
            }
            disabled={count <= TESTS.MIN_OPTIONS}
            onClick={() => dispatch({ type: 'remove-option', questionKey, optionKey: option.key })}
          >
            <Trash2 />
          </Button>
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor={`${id}-body`} className="text-body-sm text-text-secondary">
          {copy.optionBody}
        </Label>
        <AdminTextarea
          id={`${id}-body`}
          value={option.body}
          placeholder={copy.optionBodyPlaceholder}
          maxLength={TESTS.BODY_MAX_LENGTH}
          className="min-h-16"
          onChange={(event) => patch({ body: event.target.value })}
        />
      </div>

      <ImageField
        compact
        fileId={option.imageFileId}
        label={copy.optionImage}
        alt={format(copy.optionImageAlt, names)}
        onChange={(imageFileId) => patch({ imageFileId })}
      />

      <div className="flex flex-col gap-1.5">
        <Label htmlFor={`${id}-explanation`} className="text-body-sm text-text-secondary">
          {copy.optionExplanation}
        </Label>
        <AdminTextarea
          id={`${id}-explanation`}
          value={option.explanation}
          placeholder={copy.optionExplanationPlaceholder}
          maxLength={TESTS.BODY_MAX_LENGTH}
          className="min-h-16"
          onChange={(event) => patch({ explanation: event.target.value })}
        />
      </div>

      <div className="flex items-center gap-2">
        <Checkbox
          id={`${id}-correct`}
          checked={option.isCorrect}
          onCheckedChange={(checked) => patch({ isCorrect: checked === true })}
        />
        <Label htmlFor={`${id}-correct`} className="text-body-md font-medium">
          {copy.correct}
        </Label>
      </div>
    </li>
  );
});
