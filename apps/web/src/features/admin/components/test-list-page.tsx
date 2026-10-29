'use client';

import type { TestCollection, TestSummary } from '@formula/shared';
import { Plus } from 'lucide-react';
import { useMemo, useState } from 'react';

import { EmptyState } from '@/components/common/empty-state';
import { LogoLoader } from '@/components/common/logo-loader';
import { Button } from '@/components/ui/button';
import { t } from '@/locales';

import { useAdminTests } from '../hooks/use-admin-tests';
import { AdminPageHeader } from './admin-page-header';
import { CreateTestDialog } from './create-test-dialog';
import { ALL_FILTER, FilterField } from './test-filters';
import { TestRows } from './test-rows';

type ListedCollection = Exclude<TestCollection, 'subtopic'>;

interface TestListPageProps {
  title: string;
  collection: ListedCollection;
  /** Bases are filtered by category only; booklets and AMPS add year and specialty. */
  filters: 'category' | 'full';
  /** Prefix for the filter element ids (keeps ids unique and the labels linked). */
  idPrefix: string;
}

interface FilterState {
  category: string;
  year: string;
  specialty: string;
}

const NO_FILTER: FilterState = { category: ALL_FILTER, year: ALL_FILTER, specialty: ALL_FILTER };

const sortedUnique = (values: (string | null)[]): string[] =>
  [...new Set(values.filter((value): value is string => Boolean(value)))].sort((a, b) =>
    a.localeCompare(b, 'uk'),
  );

/** Options of the filter row, taken from the tests that exist (the api has no separate filters call for admins). */
function buildOptions(tests: TestSummary[]) {
  return {
    categories: sortedUnique(tests.map((test) => test.category)),
    years: sortedUnique(tests.map((test) => (test.year === null ? null : String(test.year)))).sort(
      (a, b) => Number(b) - Number(a),
    ),
    specialties: sortedUnique(tests.map((test) => test.specialty)),
  };
}

/** Shared layout of the bases, booklets and AMPS admin pages: title + "add test", filters, rows. */
export function TestListPage({ title, collection, filters, idPrefix }: TestListPageProps) {
  const copy = t.adminContent.tests;
  const { category, year, specialty } = copy.filters;
  const { data: tests, isPending, isError } = useAdminTests(collection);
  const [filter, setFilter] = useState<FilterState>(NO_FILTER);
  const [creating, setCreating] = useState(false);

  const options = useMemo(() => buildOptions(tests ?? []), [tests]);

  // A chosen value can disappear when its last test is deleted; then it counts as "all".
  const active: FilterState = {
    category: options.categories.includes(filter.category) ? filter.category : ALL_FILTER,
    year: options.years.includes(filter.year) ? filter.year : ALL_FILTER,
    specialty: options.specialties.includes(filter.specialty) ? filter.specialty : ALL_FILTER,
  };

  const visible = useMemo(
    () =>
      (tests ?? []).filter(
        (test) =>
          (active.category === ALL_FILTER || test.category === active.category) &&
          (active.year === ALL_FILTER || String(test.year) === active.year) &&
          (active.specialty === ALL_FILTER || test.specialty === active.specialty),
      ),
    [tests, active.category, active.year, active.specialty],
  );

  const addButton = (
    <Button type="button" onClick={() => setCreating(true)}>
      <Plus />
      {t.admin.tests.add}
    </Button>
  );

  return (
    <div className="flex flex-col gap-6">
      <AdminPageHeader title={title} actions={addButton} />

      {isError ? (
        <EmptyState title={copy.loadError} />
      ) : isPending ? (
        <LogoLoader size="lg" fill />
      ) : tests.length === 0 ? (
        <EmptyState title={copy.empty} description={copy.emptyHint} action={addButton} />
      ) : (
        <>
          <div className="flex flex-col gap-4 md:flex-row md:gap-6">
            <FilterField
              id={`${idPrefix}-category`}
              label={category}
              value={active.category}
              options={options.categories}
              onChange={(value) => setFilter((current) => ({ ...current, category: value }))}
            />
            {filters === 'full' ? (
              <>
                <FilterField
                  id={`${idPrefix}-year`}
                  label={year}
                  value={active.year}
                  options={options.years}
                  onChange={(value) => setFilter((current) => ({ ...current, year: value }))}
                />
                <FilterField
                  id={`${idPrefix}-specialty`}
                  label={specialty}
                  value={active.specialty}
                  options={options.specialties}
                  onChange={(value) => setFilter((current) => ({ ...current, specialty: value }))}
                />
              </>
            ) : (
              // Keeps the single filter one third wide, as in the design.
              <div className="hidden flex-[2] md:block" aria-hidden />
            )}
          </div>

          {visible.length === 0 ? (
            <EmptyState title={copy.noMatches} />
          ) : (
            <div className="flex flex-col gap-2">
              <TestRows tests={visible} />
            </div>
          )}
        </>
      )}

      {creating ? (
        <CreateTestDialog
          collection={collection}
          categories={options.categories}
          specialties={options.specialties}
          onClose={() => setCreating(false)}
        />
      ) : null}
    </div>
  );
}
