'use client';

import type { StudentTestSummary, TestCollection } from '@formula/shared';
import { useState } from 'react';

import { EmptyState } from '@/components/common/empty-state';
import { PageHeader } from '@/components/common/page-header';
import { SearchField } from '@/components/common/search-field';
import { t } from '@/locales';

import { useFavoriteTests } from '../../hooks/use-tests';
import { LEARNING_ROUTES } from '../../utils/paths';
import { PillTabPanel, PillTabs } from '../pill-tabs';
import { TestList } from '../tests/test-list';

type SavedTab = 'all' | TestCollection;

/** "Усі, Бази, Буклети, Тести, АМПС". Tests of a subtopic are called just "Тести" here. */
const SAVED_TABS = [
  'all',
  'base',
  'booklet',
  'subtopic',
  'amps',
] as const satisfies readonly SavedTab[];

function inTab(tests: readonly StudentTestSummary[], tab: SavedTab): StudentTestSummary[] {
  return tab === 'all' ? [...tests] : tests.filter((test) => test.collection === tab);
}

/** Everything the student saved, whatever its kind: bases, booklets, subtopic tests and AMPS. */
export function SavedScreen() {
  const copy = t.learning.saved;
  const favorites = useFavoriteTests();
  const [tab, setTab] = useState<SavedTab>('all');
  const [search, setSearch] = useState('');

  // A test that was just unsaved leaves the list at once, before the api list is re-read.
  const saved = favorites.data?.filter((test) => test.isFavorite);
  const query = search.trim().toLocaleLowerCase('uk');
  // The subtopic name counts too: tests of a subtopic are all titled after their category.
  const matching = saved?.filter((test) =>
    `${test.title} ${test.subtopicTitle ?? ''}`.toLocaleLowerCase('uk').includes(query),
  );

  function emptyFor(tabId: SavedTab) {
    if (query) {
      return <EmptyState title={copy.noResults.title} description={copy.noResults.description} />;
    }
    if (tabId === 'all') {
      return <EmptyState title={copy.empty.title} description={copy.empty.description} />;
    }
    return <EmptyState title={copy.emptyTab.title} />;
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={copy.title}
        action={
          <SearchField
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder={copy.searchPlaceholder}
            aria-label={copy.searchPlaceholder}
          />
        }
      />

      <PillTabs
        value={tab}
        onValueChange={setTab}
        label={copy.tabsLabel}
        items={SAVED_TABS.map((id) => ({
          id,
          label: copy.tabs[id],
          ...(matching ? { count: inTab(matching, id).length } : {}),
        }))}
      >
        {SAVED_TABS.map((id) => (
          <PillTabPanel key={id} value={id}>
            <TestList
              tests={matching ? inTab(matching, id) : undefined}
              isPending={favorites.isPending}
              isError={favorites.isError}
              onRetry={() => void favorites.refetch()}
              origin={LEARNING_ROUTES.saved}
              empty={emptyFor(id)}
            />
          </PillTabPanel>
        ))}
      </PillTabs>
    </div>
  );
}
