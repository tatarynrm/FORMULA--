'use client';

import type { StudentTestSummary } from '@formula/shared';
import type { ReactNode } from 'react';

import { cn } from '@/lib/utils';

import { LoadErrorState, PageLoading } from '../state-views';
import { TestCard } from './test-card';

interface TestListProps {
  tests: StudentTestSummary[] | undefined;
  isPending: boolean;
  isError: boolean;
  /** The list shows the previous result while a new filter is loading. */
  isRefreshing?: boolean;
  onRetry: () => void;
  /** The page the list is on: the runner and the results lead back to it. */
  origin: string;
  /** Shown when the list loaded but is empty. */
  empty: ReactNode;
  variant?: 'list' | 'detailed';
}

/** Loading, error, empty and filled states of a list of tests. */
export function TestList({
  tests,
  isPending,
  isError,
  isRefreshing = false,
  onRetry,
  origin,
  empty,
  variant = 'list',
}: TestListProps) {
  if (isPending) return <PageLoading className="min-h-60" />;
  if (!tests) return isError ? <LoadErrorState onRetry={onRetry} /> : null;
  if (tests.length === 0) return <>{empty}</>;

  return (
    <ul
      aria-busy={isRefreshing}
      className={cn('flex flex-col gap-2 transition-opacity', isRefreshing && 'opacity-60')}
    >
      {tests.map((test) => (
        <li key={test.id}>
          <TestCard test={test} origin={origin} variant={variant} />
        </li>
      ))}
    </ul>
  );
}
