'use client';

import { TEST_KINDS, type TestKind } from '@formula/shared';
import { useId } from 'react';

import { t } from '@/locales';

interface TestKindPickerProps {
  value: TestKind;
  onChange: (kind: TestKind) => void;
}

/**
 * Two selectable cards: test with answer options, or a situational test the student answers in
 * writing. Built on native radio inputs, so arrow keys and screen readers work without extra code.
 */
export function TestKindPicker({ value, onChange }: TestKindPickerProps) {
  const copy = t.adminContent.tests;
  const name = useId();

  return (
    <fieldset className="flex flex-col gap-2">
      <legend className="text-body-md text-foreground mb-1 font-medium">{copy.create.kind}</legend>
      <div className="grid gap-3 sm:grid-cols-2">
        {TEST_KINDS.map((kind) => (
          <label key={kind} className="relative flex cursor-pointer">
            <input
              type="radio"
              name={name}
              value={kind}
              checked={value === kind}
              onChange={() => onChange(kind)}
              className="peer sr-only"
            />
            <span className="border-input bg-surface-raised peer-checked:border-primary peer-checked:bg-background peer-focus-visible:ring-ring flex w-full flex-col gap-1 rounded-2xl border p-4 transition-colors peer-focus-visible:ring-[3px]">
              <span className="text-body-md text-foreground font-semibold">{copy.kinds[kind]}</span>
              <span className="text-body-sm text-muted-foreground">
                {copy.kindDescriptions[kind]}
              </span>
            </span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}
