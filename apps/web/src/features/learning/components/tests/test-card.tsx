'use client';

import type { AttemptSummary, StudentTestSummary } from '@formula/shared';
import Link from 'next/link';
import { useState } from 'react';

import { LinkButton } from '@/components/common/link-button';
import { ProgressRing } from '@/components/common/progress-ring';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { format, pluralizeUk } from '@/lib/format';
import { t } from '@/locales';

import { useAttemptHistory } from '../../hooks/use-tests';
import { LEARNING_ROUTES } from '../../utils/paths';
import { countMistakes, findLastFinished, getTestState } from '../../utils/test-state';
import { useStartTest } from '../start/start-test-provider';
import { AttemptHistory } from './attempt-history';
import { FavoriteButton } from './favorite-button';
import { KindBadge, MistakesBadge, PendingReviewBadge, TimeLimitLabel } from './test-badges';

interface TestCardProps {
  test: StudentTestSummary;
  /** The page the card is shown on: the runner and the results lead back to it. */
  origin: string;
  /** `detailed` swaps the ring for a progress bar with the last result and adds a result button (subtopic tests). */
  variant?: 'list' | 'detailed';
  /** Replaces the test title as the heading. Subtopic tests are titled by their category. */
  heading?: string;
  /** One line under the heading that explains what kind of test this is. */
  hint?: string;
}

/** Action buttons fill the width on a phone and keep their own size from `sm` up. */
const ACTION_CLASS = 'w-full sm:w-auto';

/** The label of the button that opens the last finished attempt. */
function resultButtonLabel(
  kind: StudentTestSummary['kind'],
  attempt: AttemptSummary,
  mistakes: number | null,
): string {
  const copy = t.learning.tests;
  if (kind === 'situational')
    return attempt.status === 'reviewed' ? copy.viewGrade : copy.viewAnswers;
  return mistakes !== null && mistakes > 0 ? copy.showMistakes : copy.viewResult;
}

/** The last finished attempt as one line: "3 з 4 правильно" or "4 з 8 балів". */
function lastResultText(attempt: AttemptSummary | null): string | null {
  const copy = t.learning.tests;
  if (!attempt) return null;

  if (
    attempt.status === 'completed' &&
    attempt.correctCount !== null &&
    attempt.totalCount !== null
  ) {
    return format(copy.lastResultChoice, {
      correct: attempt.correctCount,
      total: attempt.totalCount,
    });
  }
  if (attempt.status === 'reviewed' && attempt.score !== null && attempt.maxScore !== null) {
    return format(copy.lastResultReviewed, { score: attempt.score, max: attempt.maxScore });
  }
  return null;
}

/**
 * One test with everything the student can do with it: start, continue, retake, open the last
 * result with its mistakes, save it and look through the history of attempts.
 */
export function TestCard({ test, origin, variant = 'list', heading, hint }: TestCardProps) {
  const copy = t.learning.tests;
  const title = heading ?? test.title;
  // The test's own title stays visible when the card is titled by a category and the two differ.
  const ownTitle =
    heading && test.title.trim() !== '' && test.title !== heading ? test.title : null;
  const startTest = useStartTest();
  const [historyOpen, setHistoryOpen] = useState(false);

  const state = getTestState(test);
  const hasAttempts = test.attemptCount > 0;
  // The newest attempt can be an unfinished one, then the last result has to come from the history.
  const history = useAttemptHistory(test.id, state.needsHistory || (hasAttempts && historyOpen));
  const lastFinished = state.lastFinished ?? findLastFinished(history.data);

  const mistakes = countMistakes(lastFinished);
  const pendingReview = lastFinished?.status === 'pending_review';
  const resultHref = lastFinished ? LEARNING_ROUTES.result(lastFinished.id, origin) : null;
  const detailed = variant === 'detailed';
  const best = test.bestPercent;

  const questionsText = format(t.learning.common.count, {
    count: test.questionCount,
    word: pluralizeUk(test.questionCount, t.learning.common.questions),
  });
  const lastText = lastResultText(lastFinished);
  const titleId = `test-title-${test.id}`;
  const favoriteTarget = { id: test.id, isFavorite: test.isFavorite, title };

  function begin() {
    startTest({ testId: test.id, summary: test, from: origin });
  }

  return (
    <article
      aria-labelledby={titleId}
      className="bg-surface-raised border-input flex flex-col gap-4 rounded-3xl border p-5 md:p-6"
    >
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between lg:gap-6">
        <div className="flex min-w-0 flex-1 flex-col gap-2">
          <div className="flex items-start justify-between gap-3">
            <h2 id={titleId} className="text-h3 text-foreground min-w-0 break-words">
              {title}
            </h2>
            {/* On a phone the bookmark sits next to the title; on a wide screen it ends the row of actions. */}
            <FavoriteButton test={favoriteTarget} className="-mt-2 -mr-2 lg:hidden" />
          </div>

          {/* A subtopic test in a list (saved, history...) says which subtopic it belongs to, with a link to it. */}
          {!heading && test.subtopicId && test.subtopicTitle ? (
            <Link
              href={LEARNING_ROUTES.subtopic(test.subtopicId, 'tests')}
              className="text-body-sm text-primary focus-visible:ring-ring w-fit rounded-full font-medium underline-offset-4 outline-none hover:underline focus-visible:ring-[3px]"
            >
              {format(t.learning.common.subtopicOf, { subtopic: test.subtopicTitle })}
            </Link>
          ) : null}

          {hint ? <p className="text-body-sm text-muted-foreground">{hint}</p> : null}
          {ownTitle ? (
            <p className="text-body-md text-text-secondary break-words">{ownTitle}</p>
          ) : null}

          <div className="text-body-sm text-muted-foreground flex flex-wrap items-center gap-x-3 gap-y-1">
            {heading ? null : <KindBadge kind={test.kind} />}
            <span>{questionsText}</span>
            {test.timeLimitSeconds ? <TimeLimitLabel seconds={test.timeLimitSeconds} /> : null}
            {test.category ? <span>{test.category}</span> : null}
            {test.year ? <span>{test.year}</span> : null}
            {test.specialty ? <span>{test.specialty}</span> : null}
          </div>

          {test.description ? (
            <p className="text-body-sm text-muted-foreground line-clamp-2">{test.description}</p>
          ) : null}

          {detailed && (best !== null || pendingReview || lastText) ? (
            <div className="flex max-w-md flex-col gap-1.5 pt-1">
              {best !== null ? (
                <>
                  <div className="text-body-sm flex items-center justify-between gap-3">
                    <span className="text-muted-foreground">{copy.bestResult}</span>
                    <span className="text-foreground font-semibold">{best}%</span>
                  </div>
                  <Progress value={best} aria-label={copy.bestResult} />
                </>
              ) : pendingReview ? (
                <div>
                  <PendingReviewBadge />
                </div>
              ) : null}
              {lastText ? (
                <p className="text-body-xs text-muted-foreground">
                  {copy.lastResult}: {lastText}
                </p>
              ) : null}
            </div>
          ) : null}
        </div>

        <div className="flex flex-wrap items-center gap-3 lg:shrink-0 lg:flex-nowrap lg:gap-5">
          {mistakes !== null && mistakes > 0 ? (
            <MistakesBadge count={mistakes} href={resultHref ?? undefined} />
          ) : null}

          {!detailed ? (
            pendingReview && best === null ? (
              <PendingReviewBadge />
            ) : (
              <ProgressRing value={best ?? 0} />
            )
          ) : null}

          <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:flex-wrap sm:items-center">
            {state.phase === 'new' ? (
              <Button onClick={begin} className={ACTION_CLASS}>
                {copy.start}
              </Button>
            ) : null}

            {state.openAttemptId ? (
              <LinkButton
                href={LEARNING_ROUTES.attempt(state.openAttemptId, origin)}
                className={ACTION_CLASS}
              >
                {copy.continue}
              </LinkButton>
            ) : null}

            {lastFinished && resultHref && (detailed || test.kind === 'situational') ? (
              <LinkButton variant="secondary" href={resultHref} className={ACTION_CLASS}>
                {resultButtonLabel(test.kind, lastFinished, mistakes)}
              </LinkButton>
            ) : null}

            {state.phase === 'finished' ? (
              <Button
                variant={detailed ? 'default' : 'secondary'}
                onClick={begin}
                className={ACTION_CLASS}
              >
                {copy.again}
              </Button>
            ) : null}
          </div>

          <FavoriteButton test={favoriteTarget} className="hidden lg:inline-flex" />
        </div>
      </div>

      {hasAttempts ? (
        <AttemptHistory
          attemptCount={test.attemptCount}
          attempts={history.data}
          isPending={history.isPending && history.fetchStatus !== 'idle'}
          isError={history.isError}
          onRetry={() => void history.refetch()}
          open={historyOpen}
          onOpenChange={setHistoryOpen}
          origin={origin}
        />
      ) : null}
    </article>
  );
}
