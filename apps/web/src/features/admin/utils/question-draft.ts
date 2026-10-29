import type { AdminQuestion, OptionInput, QuestionInput, TestKind } from '@formula/shared';

import type { DraftOption, DraftQuestion } from '../types';

/** A new choice question starts with this many empty options. */
export const DEFAULT_OPTION_COUNT = 4;

let keyCounter = 0;

/** React key for something created in the browser, which has no stored id yet. */
function newKey(prefix: 'question' | 'option'): string {
  keyCounter += 1;
  return `new-${prefix}-${keyCounter}`;
}

export function blankOption(): DraftOption {
  return { key: newKey('option'), body: '', imageFileId: null, explanation: '', isCorrect: false };
}

export function blankQuestion(kind: TestKind): DraftQuestion {
  return {
    key: newKey('question'),
    body: '',
    imageFileId: null,
    explanation: '',
    maxScore: 1,
    options:
      kind === 'choice' ? Array.from({ length: DEFAULT_OPTION_COUNT }, () => blankOption()) : [],
  };
}

/** Copies the stored questions into editable drafts. Stored ids double as React keys. */
export function toDraft(questions: AdminQuestion[]): DraftQuestion[] {
  return questions.map((question) => ({
    key: question.id,
    id: question.id,
    body: question.body,
    imageFileId: question.imageFileId,
    explanation: question.explanation ?? '',
    maxScore: question.maxScore,
    options: question.options.map((option) => ({
      key: option.id,
      id: option.id,
      body: option.body,
      imageFileId: option.imageFileId,
      explanation: option.explanation ?? '',
      isCorrect: option.isCorrect,
    })),
  }));
}

const emptyToNull = (value: string): string | null => (value.trim() === '' ? null : value.trim());

/**
 * The exact body of `PUT /admin/tests/:id/questions`. Only DTO fields are sent (the api rejects
 * anything else with 400, e.g. `position` or `letter`). Ids of stored questions and options are
 * kept, so editing a test never orphans the answers students already gave.
 */
export function toQuestionInputs(draft: DraftQuestion[], kind: TestKind): QuestionInput[] {
  return draft.map((question): QuestionInput => {
    const base: QuestionInput = {
      ...(question.id ? { id: question.id } : {}),
      body: question.body.trim(),
      imageFileId: question.imageFileId,
      explanation: emptyToNull(question.explanation),
    };

    if (kind === 'situational') return { ...base, maxScore: question.maxScore };

    return {
      ...base,
      options: question.options.map((option): OptionInput => ({
        ...(option.id ? { id: option.id } : {}),
        body: option.body.trim(),
        imageFileId: option.imageFileId,
        explanation: emptyToNull(option.explanation),
        isCorrect: option.isCorrect,
      })),
    };
  });
}

/**
 * After a save the api returns the stored questions in the order they were sent. This copies the
 * ids it gave to new questions and options into the draft (keeping React keys and the text as it
 * is), so the next save updates them in place instead of creating them again.
 */
export function applySavedIds(draft: DraftQuestion[], saved: AdminQuestion[]): DraftQuestion[] {
  const sameShape =
    draft.length === saved.length &&
    draft.every(
      (question, index) => question.options.length === (saved[index]?.options.length ?? -1),
    );
  if (!sameShape) return toDraft(saved);

  return draft.map((question, index) => {
    const stored = saved[index];
    return {
      ...question,
      id: stored?.id ?? question.id,
      options: question.options.map((option, optionIndex) => ({
        ...option,
        id: stored?.options[optionIndex]?.id ?? option.id,
      })),
    };
  });
}

// ---- Reducer of the builder ----

export type DraftAction =
  | { type: 'add-question'; question: DraftQuestion }
  | { type: 'remove-question'; key: string }
  | { type: 'move-question'; key: string; direction: -1 | 1 }
  | {
      type: 'patch-question';
      key: string;
      patch: Partial<Pick<DraftQuestion, 'body' | 'imageFileId' | 'explanation' | 'maxScore'>>;
    }
  | { type: 'add-option'; questionKey: string; option: DraftOption }
  | { type: 'remove-option'; questionKey: string; optionKey: string }
  | { type: 'move-option'; questionKey: string; optionKey: string; direction: -1 | 1 }
  | {
      type: 'patch-option';
      questionKey: string;
      optionKey: string;
      patch: Partial<Pick<DraftOption, 'body' | 'imageFileId' | 'explanation' | 'isCorrect'>>;
    }
  | { type: 'replace'; questions: DraftQuestion[] };

function move<T>(items: T[], index: number, direction: -1 | 1): T[] {
  const target = index + direction;
  const item = items[index];
  const other = items[target];
  if (item === undefined || other === undefined) return items;

  const next = [...items];
  next[index] = other;
  next[target] = item;
  return next;
}

function updateQuestion(
  questions: DraftQuestion[],
  key: string,
  update: (question: DraftQuestion) => DraftQuestion,
): DraftQuestion[] {
  return questions.map((question) => (question.key === key ? update(question) : question));
}

/** Pure state transitions of the question builder. Untouched questions keep their identity (memoized cards). */
export function draftReducer(questions: DraftQuestion[], action: DraftAction): DraftQuestion[] {
  switch (action.type) {
    case 'add-question':
      return [...questions, action.question];
    case 'remove-question':
      return questions.filter((question) => question.key !== action.key);
    case 'move-question':
      return move(
        questions,
        questions.findIndex((question) => question.key === action.key),
        action.direction,
      );
    case 'patch-question':
      return updateQuestion(questions, action.key, (question) => ({
        ...question,
        ...action.patch,
      }));
    case 'add-option':
      return updateQuestion(questions, action.questionKey, (question) => ({
        ...question,
        options: [...question.options, action.option],
      }));
    case 'remove-option':
      return updateQuestion(questions, action.questionKey, (question) => ({
        ...question,
        options: question.options.filter((option) => option.key !== action.optionKey),
      }));
    case 'move-option':
      return updateQuestion(questions, action.questionKey, (question) => ({
        ...question,
        options: move(
          question.options,
          question.options.findIndex((option) => option.key === action.optionKey),
          action.direction,
        ),
      }));
    case 'patch-option':
      return updateQuestion(questions, action.questionKey, (question) => ({
        ...question,
        options: question.options.map((option) =>
          option.key === action.optionKey ? { ...option, ...action.patch } : option,
        ),
      }));
    case 'replace':
      return action.questions;
  }
}
