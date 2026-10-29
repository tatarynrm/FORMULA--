import type { ResultQuestion, ReviewGradeInput } from '@formula/shared';

/** What the reviewer typed for one question. */
export interface GradeDraft {
  /** The score as typed ("4", "2,5"). */
  score: string;
  comment: string;
}

/** Scores may have up to two decimals (the api rule); the form offers steps of 0.5. */
const SCORE_PATTERN = /^\d+([.,]\d{1,2})?$/;

/** "2,5" -> 2.5. `null` when the text is empty, not a number, or outside 0..max. */
export function parseScore(text: string, max: number): number | null {
  const trimmed = text.trim();
  if (!SCORE_PATTERN.test(trimmed)) return null;

  const value = Number(trimmed.replace(',', '.'));
  return value >= 0 && value <= max ? value : null;
}

/** Starting values of the form: what is stored, or empty fields for a work nobody graded yet. */
export function toGradeDrafts(questions: ResultQuestion[]): Record<string, GradeDraft> {
  return Object.fromEntries(
    questions.map((question) => [
      question.id,
      {
        score: question.score === null ? '' : String(question.score).replace('.', ','),
        comment: question.reviewerComment ?? '',
      },
    ]),
  );
}

/** Body of `PUT /admin/reviews/:attemptId`, or `null` while any question has no valid score. */
export function toGradeInputs(
  questions: ResultQuestion[],
  drafts: Record<string, GradeDraft>,
): ReviewGradeInput[] | null {
  const grades: ReviewGradeInput[] = [];

  for (const question of questions) {
    const draft = drafts[question.id];
    const score = draft ? parseScore(draft.score, question.maxScore) : null;
    if (!draft || score === null) return null;

    const comment = draft.comment.trim();
    grades.push({ questionId: question.id, score, comment: comment === '' ? null : comment });
  }

  return grades;
}
