import { cn } from '@/lib/utils';
import { format } from '@/lib/format';
import { t } from '@/locales';

import type { AnswerState } from '../../types';
import { ANSWER_STATE_STYLES } from './answer-state';

export interface AnswerMapItem {
  /** Number of the question, from 1. */
  position: number;
  state: AnswerState;
}

const STATE_ORDER: readonly AnswerState[] = ['correct', 'partial', 'wrong', 'skipped', 'pending'];

/**
 * Every question as a coloured chip (Figma "Карта відповідей"): right, wrong, skipped, waiting for the
 * review. A chip jumps to its question below; the legend lists only the states that occur.
 */
export function AnswerMap({ items }: { items: readonly AnswerMapItem[] }) {
  const copy = t.learning.result.map;
  const present = STATE_ORDER.filter((state) => items.some((item) => item.state === state));

  return (
    <section
      aria-labelledby="result-map-title"
      className="bg-surface-raised flex flex-col gap-4 rounded-2xl p-5 md:p-6"
    >
      <h2 id="result-map-title" className="text-body-lg text-foreground font-bold">
        {copy.title}
      </h2>

      <ol className="flex flex-wrap gap-2">
        {items.map((item) => (
          <li key={item.position}>
            <a
              href={`#question-${item.position}`}
              aria-label={`${format(copy.goTo, { n: item.position })}: ${copy.legend[item.state]}`}
              className={cn(
                'text-body-sm focus-visible:ring-ring flex size-9 items-center justify-center rounded-xl border font-medium transition-opacity outline-none hover:opacity-80 focus-visible:ring-[3px]',
                ANSWER_STATE_STYLES[item.state],
              )}
            >
              {item.position}
            </a>
          </li>
        ))}
      </ol>

      <ul className="text-body-xs text-muted-foreground flex flex-wrap gap-x-4 gap-y-1">
        {present.map((state) => (
          <li key={state} className="flex items-center gap-1.5">
            <span
              aria-hidden
              className={cn('size-3 rounded-full border', ANSWER_STATE_STYLES[state])}
            />
            {copy.legend[state]}
          </li>
        ))}
      </ul>
    </section>
  );
}
