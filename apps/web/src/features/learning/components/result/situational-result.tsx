import type { AttemptResult } from '@formula/shared';
import { PartyPopper } from 'lucide-react';

import { format } from '@/lib/format';
import { t } from '@/locales';

import type { BackTarget } from '../../types';
import { getSituationalState } from '../../utils/test-state';
import { elapsedSeconds, formatClock } from '../../utils/time';
import { AnswerMap } from './answer-map';
import { ResultHeader } from './result-header';
import { WrittenQuestionCard } from './result-question-card';
import { ResultSummary } from './result-summary';

/**
 * Result of a situational test. While the written answers wait for the reviewer, the student gets a
 * friendly "очікуй на перевірку" page with their own answers below. After the review it shows the
 * score, the points of every question, the reviewer's comments and the model answers.
 */
export function SituationalResult({ result, back }: { result: AttemptResult; back: BackTarget }) {
  const copy = t.learning.result;
  const { attempt, test, questions } = result;
  const reviewed = attempt.status === 'reviewed';

  const withState = questions.map((question) => ({
    question,
    state: getSituationalState(question),
  }));

  return (
    <div className="flex flex-col gap-6">
      <ResultHeader test={test} back={back} />

      {reviewed ? (
        <ReviewedSummary result={result} />
      ) : (
        <section
          aria-labelledby="result-pending-title"
          className="bg-surface-raised flex flex-col items-center gap-4 rounded-2xl px-6 py-12 text-center"
        >
          <span className="bg-accent-blue/10 text-accent-blue flex size-16 items-center justify-center rounded-full">
            <PartyPopper className="size-8" aria-hidden />
          </span>
          <h2 id="result-pending-title" className="text-h2 text-foreground max-w-2xl">
            {copy.pending.title}
          </h2>
          <p className="text-body-lg text-muted-foreground max-w-xl">{copy.pending.description}</p>
          <span className="bg-accent-blue/10 text-accent-blue text-body-sm rounded-full px-4 py-2 font-medium">
            {copy.pending.badge}
          </span>
        </section>
      )}

      {reviewed ? (
        <AnswerMap
          items={withState.map(({ question, state }) => ({ position: question.position, state }))}
        />
      ) : null}

      <section aria-labelledby="result-written-title" className="flex flex-col gap-4">
        <h2 id="result-written-title" className="text-h3 text-foreground">
          {reviewed ? copy.answers.title : copy.pending.yourAnswers}
        </h2>
        <ol className="flex flex-col gap-4">
          {withState.map(({ question, state }) => (
            <li key={question.id}>
              <WrittenQuestionCard question={question} state={state} reviewed={reviewed} />
            </li>
          ))}
        </ol>
      </section>
    </div>
  );
}

function ReviewedSummary({ result }: { result: AttemptResult }) {
  const copy = t.learning.result;
  const { attempt, questions } = result;
  const score = attempt.score ?? 0;
  const max = attempt.maxScore ?? 0;
  const seconds = elapsedSeconds(attempt.startedAt, attempt.finishedAt);

  return (
    <ResultSummary
      title={copy.reviewed.title}
      headline={format(copy.reviewed.scoreOf, { score, max })}
      percent={attempt.percent ?? 0}
      counters={[
        { value: String(score), label: copy.reviewed.counters.points },
        { value: String(max), label: copy.reviewed.counters.maxPoints },
        { value: String(questions.length), label: copy.reviewed.counters.questions },
        {
          value: seconds === null ? '–' : formatClock(seconds),
          label: copy.reviewed.counters.time,
        },
      ]}
    />
  );
}
