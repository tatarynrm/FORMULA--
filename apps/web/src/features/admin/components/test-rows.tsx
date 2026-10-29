'use client';

import type { TestSummary } from '@formula/shared';
import { Clock, ListChecks } from 'lucide-react';

import { format, pluralizeUk } from '@/lib/format';
import { t } from '@/locales';

import { useActionNotice } from '../hooks/use-action-notice';
import { useTestMutations } from '../hooks/use-admin-tests';
import { formatTimeLimit } from '../utils/format-duration';
import { ContentRow } from './content-row';
import { ErrorNotice } from './error-notice';
import { TestKindBadge } from './test-kind-badge';

function TestMeta({ test }: { test: TestSummary }) {
  const copy = t.adminContent.tests;
  const classification = [test.category, test.year, test.specialty].filter(
    (value) => value !== null && value !== '',
  );

  return (
    <>
      <TestKindBadge kind={test.kind} />
      <span className="flex items-center gap-1.5">
        <ListChecks className="size-4" aria-hidden />
        {test.questionCount === 0
          ? copy.noQuestions
          : format('{count} {word}', {
              count: test.questionCount,
              word: pluralizeUk(test.questionCount, copy.questionsCount),
            })}
      </span>
      <span className="flex items-center gap-1.5">
        <Clock className="size-4" aria-hidden />
        {formatTimeLimit(test.timeLimitSeconds)}
      </span>
      {classification.length > 0 ? <span>{classification.join(' · ')}</span> : null}
    </>
  );
}

/** Rows of the tests of a base, booklet or AMPS list (title link to the editor, kind, questions, time limit, status) with delete. */
export function TestRows({ tests }: { tests: TestSummary[] }) {
  const copy = t.adminContent.tests;
  const { remove } = useTestMutations();
  const { notice, run } = useActionNotice();

  return (
    <>
      <ErrorNotice message={notice} />
      {tests.map((test) => (
        <ContentRow
          key={test.id}
          title={test.title}
          href={`/admin/tests/${test.id}`}
          status={test.status}
          meta={<TestMeta test={test} />}
          actions={[
            {
              key: 'delete',
              label: copy.delete,
              destructive: true,
              confirm: {
                title: copy.deleteTitle,
                description: format(copy.deleteDescription, { title: test.title }),
                confirmLabel: t.adminContent.common.delete,
              },
              onSelect: () => void run(() => remove.mutateAsync(test.id), copy.deleteError),
            },
          ]}
        />
      ))}
    </>
  );
}
