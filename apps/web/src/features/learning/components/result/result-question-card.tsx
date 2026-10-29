import type { ResultOption, ResultQuestion } from '@formula/shared';
import type { ReactNode } from 'react';

import { format } from '@/lib/format';
import { t } from '@/locales';

import type { AnswerState } from '../../types';
import { ExplanationBlock } from '../attempt/explanation-block';
import { type OptionVisualState, OptionRow } from '../attempt/option-item';
import { ProtectedImage } from '../protected-image';
import { AnswerStatePill } from './answer-state';

function optionState(option: ResultOption): OptionVisualState {
  if (option.isCorrect) return 'correct';
  return option.selected ? 'wrong' : 'default';
}

/** "Твоя відповідь" / "Правильна відповідь" tag at the end of an option row (screen readers get the same words as hidden text). */
function OptionTag({ option }: { option: ResultOption }) {
  const copy = t.learning.result.question;
  const label = option.selected ? copy.yourChoice : option.isCorrect ? copy.correctOption : null;
  if (!label) return null;

  return (
    <span
      aria-hidden
      className="bg-surface-raised text-text-secondary text-body-xs mt-1 hidden shrink-0 rounded-full px-3 py-1 font-medium whitespace-nowrap sm:inline-block"
    >
      {label}
    </span>
  );
}

function optionScreenReaderText(option: ResultOption): string | undefined {
  const copy = t.learning.result.question;
  const parts: string[] = [];
  if (option.isCorrect) parts.push(copy.correctOption);
  if (option.selected) parts.push(copy.yourChoice);
  return parts.length > 0 ? parts.join('. ') : undefined;
}

interface QuestionHeadingProps {
  question: ResultQuestion;
  headingId: string;
  /** Status pill on the right of the question text. */
  status: ReactNode;
}

function QuestionHeading({ question, headingId, status }: QuestionHeadingProps) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-3">
      <h3
        id={headingId}
        className="text-body-lg text-foreground min-w-0 flex-1 font-semibold break-words whitespace-pre-wrap"
      >
        {question.position}. {question.body}
      </h3>
      {status}
    </div>
  );
}

function QuestionImage({ question }: { question: ResultQuestion }) {
  if (!question.imageFileId) return null;

  return (
    <ProtectedImage
      fileId={question.imageFileId}
      alt={format(t.learning.result.question.imageAlt, { n: question.position })}
      className="border-border max-h-96 rounded-2xl border"
    />
  );
}

const CARD_CLASS =
  'bg-surface-raised flex scroll-mt-6 flex-col gap-4 rounded-2xl p-5 outline-none md:p-6';

interface ChoiceQuestionCardProps {
  question: ResultQuestion;
  state: AnswerState;
}

/** A question of a graded choice test: the student's answer, the right one and every explanation. */
export function ChoiceQuestionCard({ question, state }: ChoiceQuestionCardProps) {
  const copy = t.learning.result.question;
  const headingId = `question-${question.position}-title`;

  return (
    <article
      id={`question-${question.position}`}
      tabIndex={-1}
      aria-labelledby={headingId}
      className={CARD_CLASS}
    >
      <QuestionHeading
        question={question}
        headingId={headingId}
        status={<AnswerStatePill state={state} />}
      />
      <QuestionImage question={question} />

      <ul className="flex flex-col gap-3">
        {question.options.map((option) => (
          <li key={option.id}>
            <OptionRow
              letter={option.letter}
              body={option.body}
              imageFileId={option.imageFileId}
              state={optionState(option)}
              srText={optionScreenReaderText(option)}
              tags={<OptionTag option={option} />}
            />
          </li>
        ))}
      </ul>

      {question.options.map((option) =>
        option.explanation ? (
          <ExplanationBlock
            key={option.id}
            letter={option.letter}
            text={option.explanation}
            srLabel={format(copy.optionExplanation, { letter: option.letter })}
          />
        ) : null,
      )}
      {question.explanation ? (
        <ExplanationBlock title={copy.explanation} text={question.explanation} />
      ) : null}
    </article>
  );
}

interface WrittenQuestionCardProps {
  question: ResultQuestion;
  state: AnswerState;
  /** The review is done: points, the reviewer's comment and the model answer are shown. */
  reviewed: boolean;
}

/** A question of a situational test: the written answer, and after the review the points, comment and model answer. */
export function WrittenQuestionCard({ question, state, reviewed }: WrittenQuestionCardProps) {
  const copy = t.learning.result;
  const headingId = `question-${question.position}-title`;
  const hasScore = reviewed && question.score !== null;

  return (
    <article
      id={`question-${question.position}`}
      tabIndex={-1}
      aria-labelledby={headingId}
      className={CARD_CLASS}
    >
      <QuestionHeading
        question={question}
        headingId={headingId}
        status={
          hasScore ? (
            <AnswerStatePill
              state={state}
              label={format(copy.reviewed.score, {
                score: question.score ?? 0,
                max: question.maxScore,
              })}
            />
          ) : (
            <AnswerStatePill state={state} />
          )
        }
      />
      <QuestionImage question={question} />

      <div className="flex flex-col gap-2">
        <p className="text-body-md text-foreground font-semibold">{copy.question.yourChoice}</p>
        <div className="bg-background border-input text-body-md rounded-2xl border p-4 break-words whitespace-pre-wrap">
          {question.textAnswer?.trim() ? (
            question.textAnswer
          ) : (
            <span className="text-muted-foreground">{copy.question.noAnswer}</span>
          )}
        </div>
      </div>

      {!reviewed && question.answered ? (
        <p className="bg-accent-blue/10 text-accent-blue text-body-md rounded-2xl p-4 font-medium">
          {copy.pending.note}
        </p>
      ) : null}

      {reviewed && question.reviewerComment ? (
        <ExplanationBlock title={copy.reviewed.comment} text={question.reviewerComment} />
      ) : null}
      {reviewed && question.explanation ? (
        <ExplanationBlock title={copy.reviewed.modelAnswer} text={question.explanation} />
      ) : null}
    </article>
  );
}
