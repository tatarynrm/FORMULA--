'use client';

import type { AttemptTestInfo } from '@formula/shared';

import { LinkButton } from '@/components/common/link-button';
import { Button } from '@/components/ui/button';
import { format } from '@/lib/format';
import { t } from '@/locales';

import type { BackTarget } from '../../types';
import { PageBackHeader } from '../page-back-header';
import { useStartTest } from '../start/start-test-provider';

interface ResultHeaderProps {
  test: AttemptTestInfo;
  back: BackTarget;
}

/** Title of a result with its two actions: back to where the test was started, and take it again. */
export function ResultHeader({ test, back }: ResultHeaderProps) {
  const copy = t.learning.result;
  const startTest = useStartTest();

  return (
    <PageBackHeader
      title={test.title}
      subtitle={
        test.subtopicTitle
          ? format(copy.pageSubtitleSubtopic, { subtopic: test.subtopicTitle })
          : copy.pageTitle
      }
      backHref={back.href}
      backLabel={back.label}
      actions={
        <>
          <Button
            type="button"
            variant="secondary"
            // A new attempt leads back to the same place, not to this result.
            onClick={() => startTest({ testId: test.id, from: back.href })}
          >
            {copy.actions.again}
          </Button>
          <LinkButton href={back.href}>{back.label}</LinkButton>
        </>
      }
    />
  );
}
