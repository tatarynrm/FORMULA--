import { TESTS, type TestKind } from '@formula/shared';

import { format } from '@/lib/format';
import { t } from '@/locales';

import type { DraftQuestion, TestSettingsDraft, ValidationProblem } from '../types';
import {
  parseTimeLimitSeconds,
  parseYear,
  type SettingsScope,
  TIME_LIMIT_MIN_SECONDS,
} from './test-settings';

interface ValidateTestInput {
  kind: TestKind;
  settings: TestSettingsDraft;
  /** The title and the year are only checked where the form has them (`collection`). */
  scope: SettingsScope;
  questions: DraftQuestion[];
}

/** Maximum score of a situational question (the api accepts 1 to 100). */
export const MAX_SCORE_LIMIT = 100;

export function isValidMaxScore(value: number): boolean {
  return Number.isInteger(value) && value >= 1 && value <= MAX_SCORE_LIMIT;
}

/**
 * What still has to be fixed before the test can be published. Mirrors the rules of the api
 * (at least one question; choice questions need 2+ options and a correct one; options need a
 * text or an image) and adds the checks of the form fields, so the admin sees the problems in
 * Ukrainian instead of an English 409 from the server.
 */
export function validateTest({
  kind,
  settings,
  scope,
  questions,
}: ValidateTestInput): ValidationProblem[] {
  const copy = t.adminContent.validation;
  const problems: ValidationProblem[] = [];

  if (scope === 'collection' && settings.title.trim() === '') {
    problems.push({ id: 'title', message: copy.name, blocksSave: true });
  }
  if (settings.timeLimitEnabled && parseTimeLimitSeconds(settings.timeLimitMinutes) === null) {
    problems.push({
      id: 'time-limit',
      message: format(copy.timeLimit, { min: TIME_LIMIT_MIN_SECONDS }),
      blocksSave: true,
    });
  }
  if (scope === 'collection' && parseYear(settings.year) === null) {
    problems.push({ id: 'year', message: copy.year, blocksSave: true });
  }

  if (questions.length === 0) {
    problems.push({ id: 'no-questions', message: copy.noQuestions, blocksSave: false });
  }

  questions.forEach((question, index) => {
    const n = index + 1;
    const add = (id: string, message: string, blocksSave: boolean) =>
      problems.push({
        id: `${question.key}:${id}`,
        message,
        questionKey: question.key,
        blocksSave,
      });

    if (question.body.trim() === '') {
      add('body', format(copy.questionEmpty, { n }), true);
    }

    if (kind === 'situational') {
      if (!isValidMaxScore(question.maxScore)) {
        add('max-score', format(copy.maxScore, { n }), true);
      }
      return;
    }

    if (question.options.length < TESTS.MIN_OPTIONS) {
      add('options-min', format(copy.optionsMin, { n, min: TESTS.MIN_OPTIONS }), false);
    }
    if (!question.options.some((option) => option.isCorrect)) {
      add('no-correct', format(copy.noCorrect, { n }), false);
    }
    question.options.forEach((option, optionIndex) => {
      if (option.body.trim() === '' && !option.imageFileId) {
        add(
          `option-${option.key}`,
          format(copy.optionEmpty, { n, letter: TESTS.LETTERS[optionIndex] ?? '?' }),
          true,
        );
      }
    });
  });

  return problems;
}
