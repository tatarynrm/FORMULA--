'use client';

import { TESTS, type TestCollection, type TestKind } from '@formula/shared';
import { useId, useMemo } from 'react';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { t } from '@/locales';

import { useAdminTests } from '../hooks/use-admin-tests';
import type { TestSettingsDraft, ValidationProblem } from '../types';
import { TEST_TEXT_LIMITS } from '../utils/test-settings';
import { AdminTextarea } from './admin-textarea';
import { Field, FieldError, FieldHint } from './field';
import { SectionCard } from './section-card';
import { TimeLimitFields } from './time-limit-fields';

interface TestSettingsFormProps {
  kind: TestKind;
  collection: Exclude<TestCollection, 'subtopic'>;
  settings: TestSettingsDraft;
  onChange: (changes: Partial<TestSettingsDraft>) => void;
  /** Problems of the settings fields are shown under the fields they belong to. */
  problems: ValidationProblem[];
  /** Element id, so a hint can scroll to the form. */
  id: string;
}

function sortedUnique(values: (string | null)[]): string[] {
  return [...new Set(values.filter((value): value is string => Boolean(value)))].sort((a, b) =>
    a.localeCompare(b, 'uk'),
  );
}

/** Category, year and specialty of a base, booklet or AMPS test. Free text, with the used values suggested. */
function CollectionFields({
  collection,
  settings,
  onChange,
  problems,
}: Pick<TestSettingsFormProps, 'collection' | 'settings' | 'onChange' | 'problems'>) {
  const copy = t.adminContent.testEditor.settings;
  const id = useId();
  const { data: tests } = useAdminTests(collection);
  const categories = useMemo(
    () => sortedUnique((tests ?? []).map((test) => test.category)),
    [tests],
  );
  const specialties = useMemo(
    () => sortedUnique((tests ?? []).map((test) => test.specialty)),
    [tests],
  );
  const yearProblem = problems.find((problem) => problem.id === 'year');

  return (
    <div className="flex flex-col gap-4">
      <div className="grid gap-4 md:grid-cols-3">
        <Field>
          <Label htmlFor={`${id}-category`}>{copy.category}</Label>
          <Input
            id={`${id}-category`}
            list={`${id}-categories`}
            value={settings.category}
            maxLength={TEST_TEXT_LIMITS.category}
            autoComplete="off"
            onChange={(event) => onChange({ category: event.target.value })}
          />
        </Field>
        <Field>
          <Label htmlFor={`${id}-year`}>{copy.year}</Label>
          <Input
            id={`${id}-year`}
            inputMode="numeric"
            value={settings.year}
            maxLength={4}
            autoComplete="off"
            aria-invalid={Boolean(yearProblem)}
            aria-describedby={yearProblem ? `${id}-year-error` : undefined}
            onChange={(event) => onChange({ year: event.target.value })}
          />
          {yearProblem ? (
            <FieldError id={`${id}-year-error`}>{yearProblem.message}</FieldError>
          ) : null}
        </Field>
        <Field>
          <Label htmlFor={`${id}-specialty`}>{copy.specialty}</Label>
          <Input
            id={`${id}-specialty`}
            list={`${id}-specialties`}
            value={settings.specialty}
            maxLength={TEST_TEXT_LIMITS.specialty}
            autoComplete="off"
            onChange={(event) => onChange({ specialty: event.target.value })}
          />
        </Field>
      </div>
      <FieldHint>{copy.freeTextHint}</FieldHint>
      <datalist id={`${id}-categories`}>
        {categories.map((value) => (
          <option key={value} value={value} />
        ))}
      </datalist>
      <datalist id={`${id}-specialties`}>
        {specialties.map((value) => (
          <option key={value} value={value} />
        ))}
      </datalist>
    </div>
  );
}

/**
 * Title, description, total time and category / year / specialty of a base, booklet or AMPS test.
 * The kind (choice or situational) is fixed at creation and only shown.
 */
export function TestSettingsForm({
  kind,
  collection,
  settings,
  onChange,
  problems,
  id: sectionId,
}: TestSettingsFormProps) {
  const copy = t.adminContent.testEditor;
  const id = useId();
  const titleProblem = problems.find((problem) => problem.id === 'title');
  const timeProblem = problems.find((problem) => problem.id === 'time-limit');

  return (
    <SectionCard id={sectionId} title={copy.settings.title} className="scroll-mt-6" tabIndex={-1}>
      <p className="text-body-sm text-text-secondary">
        <span className="text-foreground font-semibold">{copy.kindLabel}: </span>
        {t.adminContent.tests.kinds[kind]}. {copy.kindFixed}
      </p>

      <Field>
        <Label htmlFor={`${id}-title`}>{copy.settings.name}</Label>
        <Input
          id={`${id}-title`}
          value={settings.title}
          maxLength={TESTS.TITLE_MAX_LENGTH}
          autoComplete="off"
          aria-invalid={Boolean(titleProblem)}
          aria-describedby={titleProblem ? `${id}-title-error` : undefined}
          onChange={(event) => onChange({ title: event.target.value })}
        />
        {titleProblem ? (
          <FieldError id={`${id}-title-error`}>{titleProblem.message}</FieldError>
        ) : null}
      </Field>

      <Field>
        <Label htmlFor={`${id}-description`}>
          {copy.settings.description}
          <span className="text-muted-foreground font-normal">
            ({t.adminContent.common.optional})
          </span>
        </Label>
        <AdminTextarea
          id={`${id}-description`}
          value={settings.description}
          maxLength={TEST_TEXT_LIMITS.description}
          aria-describedby={`${id}-description-hint`}
          onChange={(event) => onChange({ description: event.target.value })}
        />
        <FieldHint id={`${id}-description-hint`}>{copy.settings.descriptionHint}</FieldHint>
      </Field>

      <TimeLimitFields settings={settings} onChange={onChange} problem={timeProblem} />

      <CollectionFields
        collection={collection}
        settings={settings}
        onChange={onChange}
        problems={problems}
      />
    </SectionCard>
  );
}
