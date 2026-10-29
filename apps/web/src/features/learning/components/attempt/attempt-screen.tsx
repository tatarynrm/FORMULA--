'use client';

import { ERROR_CODES } from '@formula/shared';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

import { t } from '@/locales';

import { hasErrorCode, hasStatus } from '../../hooks/query-keys';
import { useAttemptSession } from '../../hooks/use-attempts';
import { LEARNING_ROUTES } from '../../utils/paths';
import { LoadErrorState, NotFoundState, PageLoading } from '../state-views';
import { AttemptRunner } from './attempt-runner';

/**
 * Loads an attempt and hands it to the runner. An attempt that is already finished (the api answers
 * with the code `ATTEMPT_FINISHED`) goes straight to its result; an unknown one shows "not found";
 * one whose subtopic was closed for the student in the meantime (`FORBIDDEN`) shows the lock.
 */
export function AttemptScreen({ attemptId, from }: { attemptId: string; from: string | null }) {
  const copy = t.learning.attempt;
  const router = useRouter();
  const session = useAttemptSession(attemptId);
  const finished = hasErrorCode(session.error, ERROR_CODES.ATTEMPT_FINISHED);

  useEffect(() => {
    if (finished) router.replace(LEARNING_ROUTES.result(attemptId, from));
  }, [finished, router, attemptId, from]);

  if (session.isPending || finished) return <PageLoading />;

  if (session.isError) {
    if (hasErrorCode(session.error, ERROR_CODES.FORBIDDEN)) {
      return (
        <NotFoundState
          title={copy.accessWithdrawn.title}
          description={copy.accessWithdrawn.description}
        />
      );
    }
    return hasStatus(session.error, 404) ? (
      <NotFoundState title={copy.notFoundTitle} description={copy.notFoundDescription} />
    ) : (
      <LoadErrorState onRetry={() => void session.refetch()} />
    );
  }

  // A new snapshot (after "reload") mounts a fresh runner, so its local answers match the saved ones.
  return (
    <AttemptRunner
      key={session.dataUpdatedAt}
      session={session.data}
      receivedAt={session.dataUpdatedAt}
      from={from}
      onResync={() => void session.refetch()}
    />
  );
}
