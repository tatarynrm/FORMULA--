'use client';

import type { TestKind } from '@formula/shared';
import { Plus } from 'lucide-react';
import type { Dispatch } from 'react';

import { Button } from '@/components/ui/button';
import { format, pluralizeUk } from '@/lib/format';
import { t } from '@/locales';

import type { DraftQuestion } from '../../types';
import { type DraftAction, blankQuestion } from '../../utils/question-draft';
import { QuestionCard } from './question-card';

interface QuestionBuilderProps {
  kind: TestKind;
  questions: DraftQuestion[];
  /** Keys of the questions to outline in red (shown after a failed save or publish). */
  invalidKeys: ReadonlySet<string>;
  dispatch: Dispatch<DraftAction>;
}

/**
 * The questions of a test: a counter with "add", then one card per question (edit, reorder,
 * delete). It has no heading of its own, so the page or section around it names it.
 */
export function QuestionBuilder({ kind, questions, invalidKeys, dispatch }: QuestionBuilderProps) {
  const copy = t.adminContent.testEditor.questions;
  const count = questions.length;
  const add = () => dispatch({ type: 'add-question', question: blankQuestion(kind) });

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-body-md text-text-secondary font-medium">
          {format('{count} {word}', {
            count,
            word: pluralizeUk(count, t.adminContent.tests.questionsCount),
          })}
        </p>
        <Button type="button" onClick={add}>
          <Plus />
          {copy.add}
        </Button>
      </div>

      {count === 0 ? (
        <div className="border-border bg-background rounded-2xl border border-dashed px-6 py-10 text-center">
          <p className="text-body-md text-foreground font-semibold">{copy.empty}</p>
          <p className="text-body-sm text-muted-foreground mt-1">{copy.emptyHint}</p>
        </div>
      ) : (
        <>
          <ol className="flex flex-col gap-4">
            {questions.map((question, index) => (
              <li key={question.key}>
                <QuestionCard
                  question={question}
                  index={index}
                  total={count}
                  kind={kind}
                  invalid={invalidKeys.has(question.key)}
                  dispatch={dispatch}
                />
              </li>
            ))}
          </ol>
          <Button type="button" variant="secondary" className="self-start" onClick={add}>
            <Plus />
            {copy.add}
          </Button>
        </>
      )}
    </div>
  );
}
