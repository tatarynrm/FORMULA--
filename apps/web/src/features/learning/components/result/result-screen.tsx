'use client';

import { ERROR_CODES } from '@formula/shared';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

import { t } from '@/locales';

import { hasErrorCode, hasStatus } from '../../hooks/query-keys';
import { useAttemptResult } from '../../hooks/use-attempts';
import { LEARNING_ROUTES, resolveBackTarget } from '../../utils/paths';
import { LoadErrorState, NotFoundState, PageLoading } from '../state-views';
import { ChoiceResult } from './choice-result';
import { SituationalResult } from './situational-result';

/**
 * Loads the result of an attempt and shows the right page for its kind: the score and mistakes of a test
 * with options, or the "очікуй на перевірку" / review page of a situational one. An attempt that is not
 * finished yet (the api answers with the code `CONFLICT`) is sent back to the runner.
 */
export function ResultScreen({ attemptId, from }: { attemptId: string; from: string | null }) {
  const copy = t.learning.result;
  const router = useRouter();
  const result = useAttemptResult(attemptId);
  // The api answers CONFLICT while the attempt is still in progress.
  const unfinished = hasErrorCode(result.error, ERROR_CODES.CONFLICT);

  useEffect(() => {
    if (unfinished) router.replace(LEARNING_ROUTES.attempt(attemptId, from));
  }, [unfinished, router, attemptId, from]);

  if (result.isPending || unfinished) return <PageLoading />;

  if (!result.data) {
    return hasStatus(result.error, 404) ? (
      <NotFoundState title={copy.notFoundTitle} description={copy.notFoundDescription} />
    ) : (
      <LoadErrorState onRetry={() => void result.refetch()} />
    );
  }

  const data = result.data;
  const back = resolveBackTarget(from, data.test);

  return data.test.kind === 'choice' ? (
    <ChoiceResult result={data} back={back} />
  ) : (
    <SituationalResult result={data} back={back} />
  );
}
