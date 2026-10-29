'use client';

import { usePathname } from 'next/navigation';
import { useState } from 'react';

import { EmptyState } from '@/components/common/empty-state';
import { PageHeader } from '@/components/common/page-header';
import { SearchField } from '@/components/common/search-field';
import { Button } from '@/components/ui/button';
import { t } from '@/locales';

import { SEARCH_DEBOUNCE_MS } from '../../constants';
import { useDebouncedValue } from '@/hooks/use-debounced-value';
import { useCollectionTests, useTestFilters } from '../../hooks/use-tests';
import type { ListedCollection, TestFilterValues } from '../../types';
import { TestList } from '../tests/test-list';
import { TestFilters } from './test-filters';

/**
 * A list of tests of one collection (bases, booklets or AMPS): search, filters from the published tests,
 * and cards that start, continue or retake a test.
 */
export function TestCollectionScreen({ collection }: { collection: ListedCollection }) {
  const copy = t.learning.collections;
  const text = copy[collection];
  const pathname = usePathname();

  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState<TestFilterValues>({});
  const debouncedSearch = useDebouncedValue(search, SEARCH_DEBOUNCE_MS).trim();

  const options = useTestFilters(collection);
  const tests = useCollectionTests({
    collection,
    ...filters,
    ...(debouncedSearch ? { q: debouncedSearch } : {}),
  });

  const isFiltered =
    debouncedSearch !== '' ||
    filters.category !== undefined ||
    filters.year !== undefined ||
    filters.specialty !== undefined;

  function resetFilters() {
    setSearch('');
    setFilters({});
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={text.title}
        action={
          <SearchField
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder={text.searchPlaceholder}
            aria-label={text.searchPlaceholder}
          />
        }
      />

      <TestFilters
        collection={collection}
        options={options.data}
        values={filters}
        onChange={setFilters}
      />

      <TestList
        tests={tests.data}
        isPending={tests.isPending}
        isError={tests.isError}
        isRefreshing={tests.isPlaceholderData}
        onRetry={() => void tests.refetch()}
        origin={pathname}
        empty={
          isFiltered ? (
            <EmptyState
              title={copy.noResults.title}
              description={copy.noResults.description}
              action={
                <Button type="button" variant="secondary" onClick={resetFilters}>
                  {copy.filters.reset}
                </Button>
              }
            />
          ) : (
            <EmptyState title={copy.empty.title} description={copy.empty.description} />
          )
        }
      />
    </div>
  );
}
