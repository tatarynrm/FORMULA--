'use client';

import type { AttemptSummary } from '@formula/shared';
import { ChevronDown } from 'lucide-react';

import { LinkButton } from '@/components/common/link-button';
import { LogoLoader } from '@/components/common/logo-loader';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { format } from '@/lib/format';
import { cn } from '@/lib/utils';
import { t } from '@/locales';

import { LEARNING_ROUTES } from '../../utils/paths';
import { formatDateTime } from '../../utils/time';
import { AttemptStatusPill } from './test-badges';

interface AttemptHistoryProps {
  attemptCount: number;
  attempts: AttemptSummary[] | undefined;
  isPending: boolean;
  isError: boolean;
  onRetry: () => void;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** The page the history is shown on: opened attempts lead back to it. */
  origin: string;
}

/** Result of a finished attempt as short text: "3 з 4 · 75%" or "4 з 8 · 50%". Empty while unknown. */
function describeResult(attempt: AttemptSummary): string | null {
  const copy = t.learning.tests.history;
  const percent = attempt.percent ?? 0;

  if (
    attempt.status === 'completed' &&
    attempt.correctCount !== null &&
    attempt.totalCount !== null
  ) {
    return format(copy.resultChoice, {
      correct: attempt.correctCount,
      total: attempt.totalCount,
      percent,
    });
  }
  if (attempt.status === 'reviewed' && attempt.score !== null && attempt.maxScore !== null) {
    return format(copy.resultReviewed, { score: attempt.score, max: attempt.maxScore, percent });
  }
  return null;
}

/** Expandable list of every attempt of a test: date, state, result and a link to open it. */
export function AttemptHistory({
  attemptCount,
  attempts,
  isPending,
  isError,
  onRetry,
  open,
  onOpenChange,
  origin,
}: AttemptHistoryProps) {
  const copy = t.learning.tests.history;

  return (
    <Collapsible open={open} onOpenChange={onOpenChange} className="flex flex-col gap-3">
      <CollapsibleTrigger asChild>
        <button
          type="button"
          className="text-body-sm text-primary hover:text-primary-hover focus-visible:ring-ring flex w-fit items-center gap-1 rounded-full px-1 font-semibold outline-none focus-visible:ring-[3px]"
        >
          {format(copy.toggle, { count: attemptCount })}
          <ChevronDown
            className={cn('size-4 transition-transform', open && 'rotate-180')}
            aria-hidden
          />
        </button>
      </CollapsibleTrigger>

      <CollapsibleContent>
        {isPending ? <LogoLoader size="sm" className="min-h-24" /> : null}

        {isError ? (
          <div role="alert" className="flex flex-wrap items-center gap-3">
            <p className="text-body-sm text-input-error-text">{copy.loadError}</p>
            <Button type="button" variant="ghost" size="sm" onClick={onRetry}>
              {t.learning.common.retry}
            </Button>
          </div>
        ) : null}

        {attempts && attempts.length === 0 ? (
          <p className="text-body-sm text-muted-foreground">{copy.empty}</p>
        ) : null}

        {attempts && attempts.length > 0 ? (
          <ol aria-label={copy.listLabel} className="flex flex-col gap-2">
            {attempts.map((attempt, index) => {
              const result = describeResult(attempt);
              const finished = attempt.status !== 'in_progress';

              return (
                <li
                  key={attempt.id}
                  className="bg-background flex flex-wrap items-center justify-between gap-x-4 gap-y-2 rounded-2xl px-4 py-3"
                >
                  <div className="flex min-w-0 flex-col">
                    <span className="text-body-md text-foreground font-semibold">
                      {format(copy.attempt, { n: attempts.length - index })}
                    </span>
                    <span className="text-body-xs text-muted-foreground">
                      {formatDateTime(attempt.startedAt)}
                      {attempt.timed ? ` · ${copy.modeTimed}` : ''}
                      {attempt.explanationsEnabled ? ` · ${copy.modeExplained}` : ''}
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-3">
                    <AttemptStatusPill status={attempt.status} />
                    {result ? (
                      <span className="text-body-sm text-foreground font-semibold">{result}</span>
                    ) : null}
                    <LinkButton
                      variant="ghost"
                      size="sm"
                      href={
                        finished
                          ? LEARNING_ROUTES.result(attempt.id, origin)
                          : LEARNING_ROUTES.attempt(attempt.id, origin)
                      }
                    >
                      {finished ? copy.open : t.learning.tests.continue}
                    </LinkButton>
                  </div>
                </li>
              );
            })}
          </ol>
        ) : null}
      </CollapsibleContent>
    </Collapsible>
  );
}
