'use client';

import { useState } from 'react';

import { Badge } from '@/components/ui/badge';
import { format } from '@/lib/format';
import { t } from '@/locales';

import { hasStatus } from '../../hooks/query-keys';
import { useStudentSubtopic } from '../../hooks/use-catalog';
import type { SubtopicTab } from '../../types';
import { LEARNING_ROUTES } from '../../utils/paths';
import { Breadcrumbs } from '../breadcrumbs';
import { PageBackHeader } from '../page-back-header';
import { PillTabPanel, PillTabs } from '../pill-tabs';
import { LoadErrorState, NotFoundState, PageLoading } from '../state-views';
import { LockedPanel } from './locked-panel';
import { SubtopicMaterials } from './subtopic-materials';
import { SubtopicTests } from './subtopic-tests';

/**
 * One subtopic: breadcrumb, then the "Матеріали" and "Тести" tabs, or the locked state when the student
 * has no access (then neither the content nor the tests are requested).
 */
export function SubtopicScreen({
  subtopicId,
  initialTab,
}: {
  subtopicId: string;
  initialTab: SubtopicTab;
}) {
  const copy = t.learning.subtopic;
  const subtopic = useStudentSubtopic(subtopicId);
  const [tab, setTab] = useState<SubtopicTab>(initialTab);

  function changeTab(next: SubtopicTab) {
    setTab(next);
    // Keeps the tab in the address, so coming back from a test result opens the same tab.
    window.history.replaceState(
      null,
      '',
      next === 'tests' ? '?tab=tests' : window.location.pathname,
    );
  }

  if (subtopic.isPending) return <PageLoading />;

  if (subtopic.isError) {
    return hasStatus(subtopic.error, 404) ? (
      <NotFoundState title={copy.notFoundTitle} description={copy.notFoundDescription} />
    ) : (
      <LoadErrorState onRetry={() => void subtopic.refetch()} />
    );
  }

  const data = subtopic.data;
  const subjectHref = LEARNING_ROUTES.subject(data.subjectId);

  return (
    <div className="flex flex-col gap-6">
      <Breadcrumbs
        items={[
          { label: t.learning.common.home, href: LEARNING_ROUTES.home },
          { label: data.subjectTitle, href: subjectHref },
          { label: data.topicTitle },
          { label: data.title },
        ]}
      />

      <PageBackHeader
        title={data.title}
        subtitle={format(copy.topicLabel, { topic: data.topicTitle })}
        backHref={subjectHref}
        backLabel={copy.locked.backToSubject}
        actions={
          data.isFree ? (
            <Badge variant="brand" className="text-primary">
              {t.learning.common.free}
            </Badge>
          ) : null
        }
      />

      {data.hasAccess ? (
        <PillTabs
          value={tab}
          onValueChange={changeTab}
          label={copy.tabsLabel}
          items={[
            { id: 'materials', label: copy.tabs.materials },
            { id: 'tests', label: copy.tabs.tests },
          ]}
        >
          <PillTabPanel value="materials">
            <SubtopicMaterials subtopic={data} />
          </PillTabPanel>
          <PillTabPanel value="tests">
            <SubtopicTests subtopicId={data.id} subjectId={data.subjectId} />
          </PillTabPanel>
        </PillTabs>
      ) : (
        <LockedPanel subjectId={data.subjectId} />
      )}
    </div>
  );
}
