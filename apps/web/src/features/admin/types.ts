import type { ContentStatus } from '@formula/shared';

export type { ContentStatus };

// ---- Question builder draft (client side only) ----

/** An answer option while it is edited. Letters come from the position, so they are not stored here. */
export interface DraftOption {
  /** Stable React key: the stored id for saved options, a generated one for new options. */
  key: string;
  /** Id of the stored option. Missing until the first save; sending it keeps attempt history intact. */
  id?: string;
  body: string;
  imageFileId: string | null;
  explanation: string;
  isCorrect: boolean;
}

export interface DraftQuestion {
  key: string;
  id?: string;
  body: string;
  imageFileId: string | null;
  /** Choice tests: shown with the result. Situational tests: the model answer. */
  explanation: string;
  /** Situational tests only. */
  maxScore: number;
  options: DraftOption[];
}

/** The form fields of a test (everything except the questions). All values are raw input strings. */
export interface TestSettingsDraft {
  title: string;
  description: string;
  timeLimitEnabled: boolean;
  /** Minutes as typed, e.g. "30" or "1,5". */
  timeLimitMinutes: string;
  category: string;
  year: string;
  specialty: string;
}

/** One thing to fix before a test can be published. */
export interface ValidationProblem {
  /** Stable id for React keys. */
  id: string;
  message: string;
  /** Key of the question the problem belongs to, so the hint can scroll to it. */
  questionKey?: string;
  /** The api refuses to save the test while this is wrong (empty question text, empty option...). */
  blocksSave: boolean;
}
