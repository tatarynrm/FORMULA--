'use client';

import { CircleAlert, CircleCheck } from 'lucide-react';

import { cn } from '@/lib/utils';
import { t } from '@/locales';

import type { ValidationProblem } from '../../types';

interface ValidationHintsProps {
  problems: ValidationProblem[];
  /** Turns the box red. Set after a save or publish attempt was blocked, so a new test does not start in red. */
  emphasize: boolean;
  /** Scrolls to the question (or form) a problem belongs to. */
  onGoTo: (problem: ValidationProblem) => void;
}

/**
 * Everything that still has to be fixed before the test can be published (Ukrainian hints that
 * mirror the checks of the api). Items with a question open that question when clicked.
 */
export function ValidationHints({ problems, emphasize, onGoTo }: ValidationHintsProps) {
  const copy = t.adminContent.validation;

  if (problems.length === 0) {
    return (
      <p className="bg-success-soft text-success text-body-md flex items-center gap-2 rounded-2xl px-4 py-3 font-medium">
        <CircleCheck className="size-5 shrink-0" aria-hidden />
        {copy.ok}
      </p>
    );
  }

  return (
    <section
      aria-label={copy.title}
      className={cn(
        'flex flex-col gap-2 rounded-2xl border px-4 py-3',
        emphasize
          ? 'bg-input-error-bg border-input-error-border'
          : 'bg-surface-raised border-input',
      )}
    >
      <p
        className={cn(
          'text-body-md flex items-center gap-2 font-semibold',
          emphasize ? 'text-input-error-text' : 'text-foreground',
        )}
      >
        <CircleAlert className="size-5 shrink-0" aria-hidden />
        {copy.title}
      </p>
      <ul className="text-body-sm text-text-secondary flex list-disc flex-col gap-1 pl-10">
        {problems.map((problem) => (
          <li key={problem.id}>
            {problem.questionKey ? (
              <button
                type="button"
                onClick={() => onGoTo(problem)}
                className="hover:text-primary text-left underline underline-offset-2 transition-colors"
              >
                {problem.message}
              </button>
            ) : (
              problem.message
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}
