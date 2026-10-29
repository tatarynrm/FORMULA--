'use client';

import type { StudentTopic } from '@formula/shared';
import { useState } from 'react';

import { EmptyState } from '@/components/common/empty-state';
import { SearchField } from '@/components/common/search-field';
import { Badge } from '@/components/ui/badge';
import { t } from '@/locales';

import { hasStatus } from '../../hooks/query-keys';
import { useStudentSubject } from '../../hooks/use-catalog';
import { LEARNING_ROUTES } from '../../utils/paths';
import { Breadcrumbs } from '../breadcrumbs';
import { PageBackHeader } from '../page-back-header';
import { LoadErrorState, NotFoundState, PageLoading } from '../state-views';
import { TopicSection } from './topic-section';

const matches = (title: string, query: string) => title.toLocaleLowerCase('uk').includes(query);

/** A topic stays whole when its own title matches, otherwise only the matching subtopics are kept. */
function filterTopics(topics: StudentTopic[], query: string): StudentTopic[] {
  if (!query) return topics;

  return topics.flatMap((topic) => {
    if (matches(topic.title, query)) return [topic];
    const subtopics = topic.subtopics.filter((subtopic) => matches(subtopic.title, query));
    return subtopics.length > 0 ? [{ ...topic, subtopics }] : [];
  });
}

/** One subject: its topics with their subtopics (open, free or locked) and a search over them. */
export function SubjectScreen({ subjectId }: { subjectId: string }) {
  const copy = t.learning.subject;
  const subject = useStudentSubject(subjectId);
  const [search, setSearch] = useState('');

  if (subject.isPending) return <PageLoading />;

  if (subject.isError) {
    return hasStatus(subject.error, 404) ? (
      <NotFoundState title={copy.notFoundTitle} description={copy.notFoundDescription} />
    ) : (
      <LoadErrorState onRetry={() => void subject.refetch()} />
    );
  }

  const data = subject.data;
  const query = search.trim().toLocaleLowerCase('uk');
  const topics = filterTopics(data.topics, query);

  return (
    <div className="flex flex-col gap-6">
      <Breadcrumbs
        items={[
          { label: t.learning.common.home, href: LEARNING_ROUTES.home },
          { label: data.title },
        ]}
      />

      <PageBackHeader
        title={data.title}
        backHref={LEARNING_ROUTES.home}
        backLabel={copy.backLabel}
        actions={
          <>
            {data.hasFullAccess ? (
              <Badge variant="brand" className="text-primary">
                {copy.fullAccess}
              </Badge>
            ) : null}
            {data.topics.length > 0 ? (
              <div className="w-full md:w-96">
                <SearchField
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder={copy.searchPlaceholder}
                  aria-label={copy.searchPlaceholder}
                />
              </div>
            ) : null}
          </>
        }
      />

      {data.description ? (
        <p className="text-body-md text-muted-foreground max-w-3xl">{data.description}</p>
      ) : null}

      {data.topics.length === 0 ? (
        <EmptyState title={copy.emptyTitle} description={copy.emptyDescription} />
      ) : topics.length === 0 ? (
        <EmptyState title={copy.noResultsTitle} description={copy.noResultsDescription} />
      ) : (
        <div className="flex flex-col gap-3">
          {topics.map((topic) => (
            <TopicSection key={topic.id} topic={topic} forceOpen={query !== ''} />
          ))}
        </div>
      )}
    </div>
  );
}
