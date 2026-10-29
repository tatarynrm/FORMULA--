'use client';

import { useState } from 'react';

import { EmptyState } from '@/components/common/empty-state';
import { LogoLoader } from '@/components/common/logo-loader';
import { PageHeader } from '@/components/common/page-header';
import { SearchField } from '@/components/common/search-field';
import { StatCard } from '@/components/common/stat-card';
import { useCurrentUser } from '@/features/auth/hooks/use-current-user';
import { format } from '@/lib/format';
import { t } from '@/locales';

import { useProgressSummary, useSubjectProgress } from '../../hooks/use-progress';
import { LoadErrorState } from '../state-views';
import { CourseCard } from './course-card';

const NO_VALUE = '–';

/** The student's home: greeting, search, four progress numbers and a card for every subject. */
export function HomeScreen() {
  const copy = t.learning.home;
  const { data: user } = useCurrentUser();
  const summary = useProgressSummary();
  const courses = useSubjectProgress();
  const [search, setSearch] = useState('');

  // The greeting needs the name in the vocative case ("Анно"); until the profile stores it, the name is shown as typed.
  const firstName = user?.name.split(/\s+/)[0];
  const stats = summary.data;

  const query = search.trim().toLocaleLowerCase('uk');
  const visible = courses.data?.filter((course) =>
    course.title.toLocaleLowerCase('uk').includes(query),
  );

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={
          firstName
            ? format(t.cabinet.home.greeting, { name: firstName })
            : t.cabinet.home.greetingAnonymous
        }
        action={
          <SearchField
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder={copy.searchPlaceholder}
            aria-label={copy.searchPlaceholder}
          />
        }
      />

      <section aria-label={copy.statsHeading} className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          value={stats ? String(stats.testsPassed) : NO_VALUE}
          label={copy.stats.testsPassed}
          highlighted
        />
        <StatCard
          value={stats ? String(stats.subtopicsDone) : NO_VALUE}
          suffix={stats ? `/${stats.subtopicsTotal}` : undefined}
          label={copy.stats.subtopicsDone}
        />
        <StatCard
          value={typeof stats?.averagePercent === 'number' ? `${stats.averagePercent}%` : NO_VALUE}
          label={copy.stats.averageScore}
        />
        <StatCard value={stats ? String(stats.mistakes) : NO_VALUE} label={copy.stats.mistakes} />
      </section>

      <section aria-labelledby="home-courses-heading">
        <h2 id="home-courses-heading" className="sr-only">
          {copy.coursesHeading}
        </h2>

        {courses.isPending ? <LogoLoader size="md" className="min-h-60" /> : null}

        {courses.isError && !courses.data ? (
          <LoadErrorState onRetry={() => void courses.refetch()} />
        ) : null}

        {visible && visible.length > 0 ? (
          <ul className="grid gap-4 md:grid-cols-2">
            {visible.map((course) => (
              <li key={course.subjectId}>
                <CourseCard course={course} />
              </li>
            ))}
          </ul>
        ) : null}

        {courses.data && courses.data.length === 0 ? (
          <EmptyState title={copy.empty.title} description={copy.empty.description} />
        ) : null}

        {visible && visible.length === 0 && courses.data && courses.data.length > 0 ? (
          <EmptyState title={copy.noResults.title} description={copy.noResults.description} />
        ) : null}
      </section>
    </div>
  );
}
