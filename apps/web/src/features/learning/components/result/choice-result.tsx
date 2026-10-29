'use client';

import type { AttemptResult } from '@formula/shared';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { format } from '@/lib/format';
import { t } from '@/locales';

import type { BackTarget } from '../../types';
import { getChoiceState } from '../../utils/test-state';
import { elapsedSeconds, formatClock } from '../../utils/time';
import { AnswerMap } from './answer-map';
import { ChoiceQuestionCard } from './result-question-card';
import { ResultHeader } from './result-header';
import { ResultSummary } from './result-summary';

/**
 * Result of a graded test with options (Figma "Твій результат"): the score, how many answers were
 * right, wrong or skipped, an answer map, and every question with the student's answer, the right
 * one and the explanations. "Лише помилки" narrows the list to what is left to learn.
 */
export function ChoiceResult({ result, back }: { result: AttemptResult; back: BackTarget }) {
  const copy = t.learning.result;
  const { attempt, test, questions } = result;
  const [onlyMistakes, setOnlyMistakes] = useState(false);

  const total = attempt.totalCount ?? questions.length;
  const correct = attempt.correctCount ?? 0;
  const skipped = questions.filter((question) => !question.answered).length;
  const wrong = Math.max(0, total - correct - skipped);
  const seconds = elapsedSeconds(attempt.startedAt, attempt.finishedAt);

  const withState = questions.map((question) => ({ question, state: getChoiceState(question) }));
  const visible = onlyMistakes ? withState.filter(({ state }) => state !== 'correct') : withState;

  return (
    <div className="flex flex-col gap-6">
      <ResultHeader test={test} back={back} />

      <ResultSummary
        title={copy.title}
        headline={format(copy.correctOf, { correct, total })}
        percent={attempt.percent ?? 0}
        counters={[
          { value: String(correct), label: copy.counters.correct },
          { value: String(wrong), label: copy.counters.mistakes },
          { value: String(skipped), label: copy.counters.skipped },
          { value: seconds === null ? '–' : formatClock(seconds), label: copy.counters.time },
        ]}
      />

      <AnswerMap
        items={withState.map(({ question, state }) => ({ position: question.position, state }))}
      />

      <section aria-labelledby="result-answers-title" className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 id="result-answers-title" className="text-h3 text-foreground">
            {copy.answers.title}
          </h2>
          <div role="group" aria-label={copy.answers.filterLabel} className="flex gap-2">
            <Button
              type="button"
              size="sm"
              variant={onlyMistakes ? 'outline' : 'default'}
              aria-pressed={!onlyMistakes}
              onClick={() => setOnlyMistakes(false)}
            >
              {copy.answers.all}
            </Button>
            <Button
              type="button"
              size="sm"
              variant={onlyMistakes ? 'default' : 'outline'}
              aria-pressed={onlyMistakes}
              onClick={() => setOnlyMistakes(true)}
            >
              {copy.answers.mistakes}
            </Button>
          </div>
        </div>

        {visible.length === 0 ? (
          <p
            role="status"
            className="bg-success-soft text-success text-body-md rounded-2xl p-4 font-medium"
          >
            {copy.answers.noMistakes}
          </p>
        ) : (
          <ol className="flex flex-col gap-4">
            {visible.map(({ question, state }) => (
              <li key={question.id}>
                <ChoiceQuestionCard question={question} state={state} />
              </li>
            ))}
          </ol>
        )}
      </section>
    </div>
  );
}
