'use client';

import { TESTS, type TestKind } from '@formula/shared';
import { ChevronDown, ChevronUp, Plus, Trash2 } from 'lucide-react';
import { type Dispatch, memo, useId, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { format } from '@/lib/format';
import { cn } from '@/lib/utils';
import { t } from '@/locales';

import type { DraftQuestion } from '../../types';
import { type DraftAction, blankOption } from '../../utils/question-draft';
import { MAX_SCORE_LIMIT } from '../../utils/test-validation';
import { AdminTextarea } from '../admin-textarea';
import { ConfirmDialog } from '../confirm-dialog';
import { FieldHint } from '../field';
import { ImageField } from './image-field';
import { OptionRow } from './option-row';

interface QuestionCardProps {
  question: DraftQuestion;
  /** Zero-based position in the test. */
  index: number;
  total: number;
  kind: TestKind;
  /** The question has something to fix before publishing: the card gets a red outline. */
  invalid: boolean;
  dispatch: Dispatch<DraftAction>;
}

/**
 * One question of the builder. Choice questions have 2 to 10 answer options (letters from the
 * position), situational ones a model answer and a maximum score. Memoized, so typing in one
 * question does not re-render the others.
 */
export const QuestionCard = memo(function QuestionCard({
  question,
  index,
  total,
  kind,
  invalid,
  dispatch,
}: QuestionCardProps) {
  const copy = t.adminContent.questions;
  const id = useId();
  const number = index + 1;
  const names = { n: number };
  const [confirmRemove, setConfirmRemove] = useState(false);

  const patch = (
    changes: Partial<Pick<DraftQuestion, 'body' | 'imageFileId' | 'explanation' | 'maxScore'>>,
  ) => dispatch({ type: 'patch-question', key: question.key, patch: changes });
  const move = (direction: -1 | 1) =>
    dispatch({ type: 'move-question', key: question.key, direction });

  return (
    <article
      id={`question-${question.key}`}
      tabIndex={-1}
      aria-labelledby={`${id}-heading`}
      className={cn(
        'bg-surface-raised flex flex-col gap-4 rounded-3xl border p-4 outline-none md:p-6',
        invalid ? 'border-input-error-border' : 'border-input',
      )}
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 id={`${id}-heading`} className="text-body-lg text-foreground font-bold">
          {format(copy.heading, names)}
        </h3>
        <div className="flex items-center gap-1">
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            aria-label={format(copy.moveUp, names)}
            title={format(copy.moveUp, names)}
            disabled={index === 0}
            onClick={() => move(-1)}
          >
            <ChevronUp />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            aria-label={format(copy.moveDown, names)}
            title={format(copy.moveDown, names)}
            disabled={index === total - 1}
            onClick={() => move(1)}
          >
            <ChevronDown />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            aria-label={format(copy.remove, names)}
            title={format(copy.remove, names)}
            onClick={() => setConfirmRemove(true)}
          >
            <Trash2 />
          </Button>
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor={`${id}-body`}>{copy.body}</Label>
        <AdminTextarea
          id={`${id}-body`}
          value={question.body}
          placeholder={copy.bodyPlaceholder}
          maxLength={TESTS.BODY_MAX_LENGTH}
          onChange={(event) => patch({ body: event.target.value })}
        />
      </div>

      <ImageField
        fileId={question.imageFileId}
        label={copy.image}
        alt={format(copy.imageAlt, names)}
        onChange={(imageFileId) => patch({ imageFileId })}
      />

      {kind === 'choice' ? (
        <>
          <div className="flex flex-col gap-3">
            <div className="flex flex-col gap-0.5">
              <h4 className="text-body-md text-foreground font-semibold">{copy.options}</h4>
              <FieldHint>{copy.optionsHint}</FieldHint>
            </div>
            <ol className="flex flex-col gap-3">
              {question.options.map((option, optionIndex) => (
                <OptionRow
                  key={option.key}
                  option={option}
                  index={optionIndex}
                  count={question.options.length}
                  questionKey={question.key}
                  questionNumber={number}
                  dispatch={dispatch}
                />
              ))}
            </ol>
            <div className="flex flex-wrap items-center gap-3">
              <Button
                type="button"
                variant="secondary"
                size="sm"
                disabled={question.options.length >= TESTS.MAX_OPTIONS}
                onClick={() =>
                  dispatch({ type: 'add-option', questionKey: question.key, option: blankOption() })
                }
              >
                <Plus />
                {copy.addOption}
              </Button>
              {question.options.length >= TESTS.MAX_OPTIONS ? (
                <FieldHint>{format(copy.maxOptions, { max: TESTS.MAX_OPTIONS })}</FieldHint>
              ) : null}
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor={`${id}-explanation`}>{copy.explanation}</Label>
            <AdminTextarea
              id={`${id}-explanation`}
              value={question.explanation}
              placeholder={copy.explanationPlaceholder}
              maxLength={TESTS.ANSWER_MAX_LENGTH}
              aria-describedby={`${id}-explanation-hint`}
              onChange={(event) => patch({ explanation: event.target.value })}
            />
            <FieldHint id={`${id}-explanation-hint`}>{copy.explanationHint}</FieldHint>
          </div>
        </>
      ) : (
        <>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor={`${id}-model`}>{copy.situational.modelAnswer}</Label>
            <AdminTextarea
              id={`${id}-model`}
              value={question.explanation}
              placeholder={copy.situational.modelAnswerPlaceholder}
              maxLength={TESTS.ANSWER_MAX_LENGTH}
              aria-describedby={`${id}-model-hint`}
              onChange={(event) => patch({ explanation: event.target.value })}
            />
            <FieldHint id={`${id}-model-hint`}>{copy.situational.modelAnswerHint}</FieldHint>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor={`${id}-score`}>{copy.situational.maxScore}</Label>
            <Input
              id={`${id}-score`}
              type="number"
              inputMode="numeric"
              min={1}
              max={MAX_SCORE_LIMIT}
              step={1}
              className="max-w-40"
              value={Number.isNaN(question.maxScore) ? '' : question.maxScore}
              aria-describedby={`${id}-score-hint`}
              onChange={(event) =>
                patch({
                  maxScore: event.target.value === '' ? Number.NaN : Number(event.target.value),
                })
              }
            />
            <FieldHint id={`${id}-score-hint`}>{copy.situational.maxScoreHint}</FieldHint>
          </div>
        </>
      )}

      <ConfirmDialog
        open={confirmRemove}
        onOpenChange={setConfirmRemove}
        title={format(copy.removeTitle, names)}
        description={copy.removeDescription}
        confirmLabel={copy.removeConfirm}
        onConfirm={() => dispatch({ type: 'remove-question', key: question.key })}
      />
    </article>
  );
});
