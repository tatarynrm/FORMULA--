'use client';

import type { TestFilterOptions } from '@formula/shared';
import { useId } from 'react';

import { SegmentedControl } from '@/components/common/segmented-control';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { t } from '@/locales';

import { COLLECTION_FILTERS, MAX_CATEGORY_TABS } from '../../constants';
import type { ListedCollection, TestFilterValues } from '../../types';

const ALL = '__all__';

interface FilterFieldProps {
  id: string;
  label: string;
  value: string | undefined;
  options: readonly string[];
  onChange: (value: string | undefined) => void;
}

/** Labelled pill dropdown with an "all" entry (Figma "filter"). */
function FilterField({ id, label, value, options, onChange }: FilterFieldProps) {
  return (
    <div className="flex min-w-0 flex-1 flex-col gap-1">
      <label htmlFor={id} className="text-body-md text-input-placeholder">
        {label}
      </label>
      <Select
        value={value ?? ALL}
        onValueChange={(next) => onChange(next === ALL ? undefined : next)}
      >
        <SelectTrigger
          id={id}
          className="bg-surface-raised border-input text-body-md text-input-placeholder w-full rounded-full px-4 shadow-none data-[size=default]:h-12"
        >
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL}>{t.learning.collections.filters.all}</SelectItem>
          {options.map((option) => (
            <SelectItem key={option} value={option}>
              {option}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

interface TestFiltersProps {
  collection: ListedCollection;
  options: TestFilterOptions | undefined;
  values: TestFilterValues;
  onChange: (values: TestFilterValues) => void;
}

/**
 * Filters of a test list, built from the values the published tests really have. Bases are filtered by
 * category only (as tabs while there are few); booklets and AMPS by category, year and specialty.
 */
export function TestFilters({ collection, options, values, onChange }: TestFiltersProps) {
  const copy = t.learning.collections.filters;
  const idPrefix = useId();
  const fields = COLLECTION_FILTERS[collection];

  if (!options) return null;

  const categories = fields.includes('category') ? options.categories : [];
  const years = fields.includes('year') ? options.years.map(String) : [];
  const specialties = fields.includes('specialty') ? options.specialties : [];

  if (categories.length === 0 && years.length === 0 && specialties.length === 0) return null;

  // A handful of categories reads best as tabs ("Крок 1 | Крок 2"), many need a dropdown.
  const categoryAsTabs =
    fields.length === 1 && categories.length > 0 && categories.length <= MAX_CATEGORY_TABS;

  if (categoryAsTabs) {
    return (
      <SegmentedControl
        label={copy.category}
        value={values.category ?? ALL}
        onValueChange={(next) => onChange({ ...values, category: next === ALL ? undefined : next })}
        items={[
          { id: ALL, label: copy.all },
          ...categories.map((category) => ({ id: category, label: category })),
        ]}
      />
    );
  }

  return (
    <div role="group" aria-label={copy.label} className="flex flex-col gap-4 md:flex-row md:gap-6">
      {categories.length > 0 ? (
        <FilterField
          id={`${idPrefix}-category`}
          label={copy.category}
          value={values.category}
          options={categories}
          onChange={(category) => onChange({ ...values, category })}
        />
      ) : null}
      {years.length > 0 ? (
        <FilterField
          id={`${idPrefix}-year`}
          label={copy.year}
          value={values.year === undefined ? undefined : String(values.year)}
          options={years}
          onChange={(year) =>
            onChange({ ...values, year: year === undefined ? undefined : Number(year) })
          }
        />
      ) : null}
      {specialties.length > 0 ? (
        <FilterField
          id={`${idPrefix}-specialty`}
          label={copy.specialty}
          value={values.specialty}
          options={specialties}
          onChange={(specialty) => onChange({ ...values, specialty })}
        />
      ) : null}
    </div>
  );
}
