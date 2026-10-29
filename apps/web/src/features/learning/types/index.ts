import type { StudentTestSummary, TestCollection } from '@formula/shared';

/** What a screen hands to the start dialog when the student wants to take a test. */
export interface StartTestRequest {
  testId: string;
  /** The test as the list knows it: the dialog opens at once, and an unfinished attempt is continued without asking. */
  summary?: StudentTestSummary;
  /** Page the result leads back to. Defaults to the page the student is on. */
  from?: string;
}

/** Collections shown as flat lists (bases, booklets, AMPS). Subtopic tests live inside their subtopic. */
export type ListedCollection = Exclude<TestCollection, 'subtopic'>;

export type SubtopicTab = 'materials' | 'tests';

/** The filters a collection list can offer. */
export type TestFilterField = 'category' | 'year' | 'specialty';

/** Selected filter values of a list. `undefined` means "all". */
export interface TestFilterValues {
  category?: string;
  year?: number;
  specialty?: string;
}

/** Visual state of one question in the answer map. */
export type AnswerState = 'correct' | 'wrong' | 'partial' | 'skipped' | 'pending';

/** Where the student started from, and where the result page should lead back. */
export interface BackTarget {
  href: string;
  label: string;
}
