'use client';

import { type AnswerFeedback, type StudentQuestion, TESTS } from '@formula/shared';
import { Check } from 'lucide-react';
import { type Ref, useId } from 'react';

import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { format } from '@/lib/format';
import { cn } from '@/lib/utils';
import { t } from '@/locales';

import type { SaveStatus } from '../../hooks/use-answer-saver';
import { ProtectedImage } from '../protected-image';
import { ExplanationBlock } from './explanation-block';
import { OptionGroup } from './option-group';

interface FeedbackPanelProps {
  question: StudentQuestion;
  feedback: AnswerFeedback;
}

/** Explanation mode: was the answer right, which options were right, and why. */
function FeedbackPanel({ question, feedback }: FeedbackPanelProps) {
  const copy = t.learning.attempt.feedback;
  const letters = question.options
    .filter((option) => feedback.correctOptionIds.includes(option.id))
    .map((option) => option.letter)
    .join(', ');

  return (
    <div className="flex flex-col gap-3">
      <p
        className={cn(
          'text-body-md font-semibold',
          feedback.isCorrect ? 'text-success' : 'text-destructive',
        )}
      >
        {feedback.isCorrect ? copy.correct : copy.wrong}
        {feedback.isCorrect ? null : (
          <span className="text-foreground font-normal">
            {' '}
            {format(copy.correctAnswer, { letters })}
          </span>
        )}
      </p>

      {question.options.map((option) => {
        const text = feedback.optionExplanations[option.id];
        return text ? (
          <ExplanationBlock
            key={option.id}
            letter={option.letter}
            text={text}
            srLabel={format(copy.optionExplanation, { letter: option.letter })}
          />
        ) : null;
      })}

      {feedback.explanation ? (
        <ExplanationBlock title={copy.explanation} text={feedback.explanation} />
      ) : null}
    </div>
  );
}

function SaveIndicator({
  status,
  onRetry,
}: {
  status: SaveStatus | undefined;
  onRetry: () => void;
}) {
  const copy = t.learning.attempt.save;

  if (status === 'error') {
    return (
      <p
        role="alert"
        className="text-body-sm text-input-error-text flex flex-wrap items-center gap-2"
      >
        {copy.error}
        <Button type="button" variant="ghost" size="sm" onClick={onRetry}>
          {copy.retry}
        </Button>
      </p>
    );
  }
  if (status === 'saving') {
    return (
      <p role="status" className="text-body-xs text-muted-foreground">
        {copy.saving}
      </p>
    );
  }
  if (status === 'saved') {
    return (
      <p role="status" className="text-body-xs text-muted-foreground flex items-center gap-1">
        <Check className="size-4" aria-hidden />
        {copy.saved}
      </p>
    );
  }
  return <span />;
}

interface QuestionViewProps {
  question: StudentQuestion;
  /** Position of the question in the test, from 1. */
  number: number;
  total: number;
  situational: boolean;
  explanationMode: boolean;
  selection: readonly string[];
  text: string;
  /** Explanation mode: set once the answer is final. */
  feedback: AnswerFeedback | null;
  /** An answer of explanation mode is being sent. */
  submitting: boolean;
  /** The last answer of explanation mode could not be sent. */
  submitFailed: boolean;
  /** Autosave state of this question (exam mode and written answers). */
  saveStatus: SaveStatus | undefined;
  headingRef: Ref<HTMLHeadingElement>;
  onToggleOption: (optionId: string) => void;
  onSubmit: () => void;
  onClear: () => void;
  onTextChange: (value: string) => void;
  onTextBlur: () => void;
  onRetrySave: () => void;
}

/** One question: text, picture, the options or a text field, and in explanation mode the feedback. */
export function QuestionView({
  question,
  number,
  total,
  situational,
  explanationMode,
  selection,
  text,
  feedback,
  submitting,
  submitFailed,
  saveStatus,
  headingRef,
  onToggleOption,
  onSubmit,
  onClear,
  onTextChange,
  onTextBlur,
  onRetrySave,
}: QuestionViewProps) {
  const copy = t.learning.attempt;
  const headingId = useId();
  const hintId = useId();
  const textId = useId();

  const hasSelection = selection.length > 0;
  const showSubmit = explanationMode && question.multiple && feedback === null;
  const showClear = !explanationMode && !situational && hasSelection;

  return (
    <section
      aria-labelledby={headingId}
      className="bg-surface-raised flex flex-col gap-5 rounded-2xl p-5 md:p-6"
    >
      <div className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-body-xs text-muted-foreground">
            {format(copy.questionLabel, { n: number, total })}
          </p>
          {situational ? null : (
            <span className="bg-secondary text-text-secondary text-body-xs rounded-full px-3 py-1 font-medium">
              {explanationMode ? copy.explanationsOn : copy.explanationsOff}
            </span>
          )}
        </div>

        <h2
          id={headingId}
          ref={headingRef}
          tabIndex={-1}
          className="text-body-lg text-foreground font-semibold break-words whitespace-pre-wrap outline-none"
        >
          {question.body}
        </h2>

        {question.imageFileId ? (
          <ProtectedImage
            fileId={question.imageFileId}
            alt={format(t.learning.result.question.imageAlt, { n: number })}
            className="border-border max-h-96 rounded-2xl border"
          />
        ) : null}
      </div>

      {situational ? (
        <div className="flex flex-col gap-2">
          <label htmlFor={textId} className="text-body-md text-foreground font-semibold">
            {copy.answerLabel}
          </label>
          <Textarea
            id={textId}
            value={text}
            maxLength={TESTS.ANSWER_MAX_LENGTH}
            placeholder={copy.answerPlaceholder}
            onChange={(event) => onTextChange(event.target.value)}
            onBlur={onTextBlur}
            className="border-input bg-surface-raised text-body-md min-h-48 rounded-2xl px-4 py-3 md:text-base"
          />
          <p className="text-body-xs text-muted-foreground">{copy.answerHint}</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          <p id={hintId} className="text-body-sm text-muted-foreground">
            {question.multiple ? copy.hintMultiple : copy.hintSingle}
          </p>
          <OptionGroup
            question={question}
            labelId={headingId}
            hintId={hintId}
            selected={selection}
            feedback={feedback}
            busy={submitting}
            onToggle={onToggleOption}
          />
        </div>
      )}

      {feedback ? <FeedbackPanel question={question} feedback={feedback} /> : null}

      {submitFailed ? (
        <p role="alert" className="text-body-sm text-input-error-text">
          {copy.save.error}
        </p>
      ) : null}

      <div className="flex min-h-10 flex-wrap items-center justify-between gap-3">
        <SaveIndicator status={saveStatus} onRetry={onRetrySave} />

        <div className="flex flex-wrap items-center gap-3">
          {showClear ? (
            <Button type="button" variant="ghost" size="sm" onClick={onClear}>
              {copy.clearAnswer}
            </Button>
          ) : null}
          {showSubmit ? (
            <Button type="button" onClick={onSubmit} disabled={!hasSelection || submitting}>
              {copy.submitAnswer}
            </Button>
          ) : null}
        </div>
      </div>

      {showSubmit && hasSelection ? (
        <p className="text-body-xs text-muted-foreground">{copy.submitHint}</p>
      ) : null}
    </section>
  );
}
