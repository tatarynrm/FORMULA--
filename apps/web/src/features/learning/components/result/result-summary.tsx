import type { ReactNode } from 'react';

import { ProgressRing } from '@/components/common/progress-ring';

interface ResultCounter {
  value: string;
  label: string;
}

interface ResultSummaryProps {
  /** "Твій результат". */
  title: string;
  /** The line under the title: "3 з 4 правильно". */
  headline: string;
  percent: number;
  counters: readonly ResultCounter[];
  /** Optional extra block, for example a note. */
  children?: ReactNode;
}

/** The top card of a result: title, the score as a ring and a row of counters (Figma "Твій результат"). */
export function ResultSummary({
  title,
  headline,
  percent,
  counters,
  children,
}: ResultSummaryProps) {
  return (
    <section
      aria-labelledby="result-title"
      className="bg-surface-raised flex flex-col gap-6 rounded-2xl p-5 md:p-6"
    >
      <div className="bg-secondary flex flex-wrap items-center justify-between gap-4 rounded-2xl p-5 md:p-6">
        <div className="flex min-w-0 flex-col gap-1">
          <h2 id="result-title" className="text-body-md text-muted-foreground font-medium">
            {title}
          </h2>
          <p className="text-h2 text-foreground">{headline}</p>
        </div>
        <ProgressRing value={percent} className="size-24" />
      </div>

      <dl className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {counters.map((counter) => (
          // The label comes first in the markup (definition lists need it) and is shown under the number.
          <div key={counter.label} className="flex flex-col-reverse items-center gap-1 text-center">
            <dt className="text-body-sm text-muted-foreground">{counter.label}</dt>
            <dd className="text-title text-foreground">{counter.value}</dd>
          </div>
        ))}
      </dl>

      {children}
    </section>
  );
}
