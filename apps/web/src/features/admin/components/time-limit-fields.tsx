'use client';

import { useId } from 'react';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { t } from '@/locales';

import type { TestSettingsDraft, ValidationProblem } from '../types';
import { Field, FieldError } from './field';

interface TimeLimitFieldsProps {
  settings: TestSettingsDraft;
  onChange: (changes: Partial<TestSettingsDraft>) => void;
  /** The "time-limit" problem of the form, shown under the minutes field. */
  problem?: ValidationProblem | undefined;
}

/**
 * Optional total time for the whole test: a switch and, when it is on, the minutes. The student
 * may accept this time or take the test without a limit (that choice is theirs, at the start).
 */
export function TimeLimitFields({ settings, onChange, problem }: TimeLimitFieldsProps) {
  const copy = t.adminContent.testEditor.settings;
  const id = useId();

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-start gap-3">
        <Switch
          id={`${id}-limit`}
          checked={settings.timeLimitEnabled}
          aria-describedby={`${id}-limit-hint`}
          className="mt-0.5"
          onCheckedChange={(timeLimitEnabled) =>
            onChange({
              timeLimitEnabled,
              // A sensible starting value instead of an empty box.
              ...(timeLimitEnabled && settings.timeLimitMinutes.trim() === ''
                ? { timeLimitMinutes: '30' }
                : {}),
            })
          }
        />
        <div className="flex min-w-0 flex-col gap-1">
          <Label htmlFor={`${id}-limit`}>{copy.timeLimit}</Label>
          <p id={`${id}-limit-hint`} className="text-body-xs text-muted-foreground">
            {copy.timeLimitHint}
          </p>
        </div>
      </div>

      {settings.timeLimitEnabled ? (
        <Field className="max-w-60">
          <Label htmlFor={`${id}-minutes`}>{copy.timeLimitMinutes}</Label>
          <Input
            id={`${id}-minutes`}
            inputMode="decimal"
            value={settings.timeLimitMinutes}
            maxLength={8}
            autoComplete="off"
            aria-invalid={Boolean(problem)}
            aria-describedby={problem ? `${id}-minutes-error` : undefined}
            onChange={(event) => onChange({ timeLimitMinutes: event.target.value })}
          />
          {problem ? <FieldError id={`${id}-minutes-error`}>{problem.message}</FieldError> : null}
        </Field>
      ) : null}
    </div>
  );
}
