'use client';

import type { TestKind } from '@formula/shared';

import { EmptyState } from '@/components/common/empty-state';
import { t } from '@/locales';

import { hasStatus } from '../../hooks/query-keys';
import { useSubtopicTests } from '../../hooks/use-tests';
import { LEARNING_ROUTES } from '../../utils/paths';
import { LoadErrorState, PageLoading } from '../state-views';
import { TestCard } from '../tests/test-card';
import { LockedPanel } from './locked-panel';

/** A subtopic has two categories of tests, always shown in this order. */
const CATEGORY_ORDER: readonly TestKind[] = ['choice', 'situational'];

interface SubtopicTestsProps {
  subtopicId: string;
  subjectId: string;
}

/**
 * The "Тести" tab: «Тест з варіантами відповідей» (the result comes at once) and «Ситуаційні задачі»
 * (written answers, the result comes after a review). Each category is one card titled with its
 * name, and a category without a published test is simply not shown. The tab only exists for subtopics
 * the student can open, because the api refuses the tests of a locked one; if access is withdrawn
 * while the page is open, the locked state takes over.
 */
export function SubtopicTests({ subtopicId, subjectId }: SubtopicTestsProps) {
  const copy = t.learning.subtopic.tests;
  const tests = useSubtopicTests(subtopicId, true);
  const origin = LEARNING_ROUTES.subtopic(subtopicId, 'tests');

  if (hasStatus(tests.error, 403)) return <LockedPanel subjectId={subjectId} />;
  if (tests.isPending) return <PageLoading className="min-h-60" />;
  if (!tests.data) return <LoadErrorState onRetry={() => void tests.refetch()} />;

  const categories = CATEGORY_ORDER.flatMap((kind) =>
    tests.data.filter((test) => test.kind === kind).map((test) => ({ kind, test })),
  );

  if (categories.length === 0) {
    return <EmptyState title={copy.emptyTitle} description={copy.emptyDescription} />;
  }

  return (
    <ul className="flex flex-col gap-4">
      {categories.map(({ kind, test }) => (
        <li key={test.id}>
          <TestCard
            test={test}
            origin={origin}
            variant="detailed"
            heading={copy.categories[kind].title}
            hint={copy.categories[kind].hint}
          />
        </li>
      ))}
    </ul>
  );
}
