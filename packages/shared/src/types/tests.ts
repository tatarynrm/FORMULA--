import type {
  AttemptStatus,
  ContentStatus,
  TestCollection,
  TestKind,
} from '../constants/content.js';

// ---- Admin side ----

export interface TestSummary {
  id: string;
  kind: TestKind;
  collection: TestCollection;
  subtopicId: string | null;
  title: string;
  description: string | null;
  category: string | null;
  year: number | null;
  specialty: string | null;
  status: ContentStatus;
  timeLimitSeconds: number | null;
  questionCount: number;
  sortOrder: number;
  updatedAt: string;
}

export interface AdminOption {
  id: string;
  letter: string;
  body: string;
  imageFileId: string | null;
  explanation: string | null;
  isCorrect: boolean;
}

export interface AdminQuestion {
  id: string;
  position: number;
  body: string;
  imageFileId: string | null;
  explanation: string | null;
  maxScore: number;
  options: AdminOption[];
}

export interface AdminTest extends TestSummary {
  questions: AdminQuestion[];
}

/** Ids are kept for questions and options that already exist, so attempt history survives edits. */
export interface QuestionInput {
  id?: string;
  body: string;
  imageFileId?: string | null;
  explanation?: string | null;
  maxScore?: number;
  options?: OptionInput[];
}

export interface OptionInput {
  id?: string;
  body: string;
  imageFileId?: string | null;
  explanation?: string | null;
  isCorrect: boolean;
}

// ---- Student side ----

export interface AttemptSummary {
  id: string;
  testId: string;
  status: AttemptStatus;
  startedAt: string;
  finishedAt: string | null;
  timed: boolean;
  explanationsEnabled: boolean;
  score: number | null;
  maxScore: number | null;
  correctCount: number | null;
  totalCount: number | null;
  /** 0-100, only for graded attempts. */
  percent: number | null;
}

export interface StudentTestSummary {
  id: string;
  kind: TestKind;
  collection: TestCollection;
  /** The subtopic of a subtopic test (so lists can say where it belongs). `null` for bases, booklets, AMPS. */
  subtopicId: string | null;
  subtopicTitle: string | null;
  title: string;
  description: string | null;
  category: string | null;
  year: number | null;
  specialty: string | null;
  timeLimitSeconds: number | null;
  questionCount: number;
  isFavorite: boolean;
  attemptCount: number;
  bestPercent: number | null;
  lastAttempt: AttemptSummary | null;
}

export interface TestFilterOptions {
  categories: string[];
  years: number[];
  specialties: string[];
}

export interface StudentOption {
  id: string;
  letter: string;
  body: string;
  imageFileId: string | null;
}

/** A question as shown during the attempt: never contains the right answers. */
export interface StudentQuestion {
  id: string;
  position: number;
  body: string;
  imageFileId: string | null;
  /** More than one option is right, so the UI offers checkboxes instead of radio buttons. */
  multiple: boolean;
  options: StudentOption[];
}

export interface SavedAnswer {
  questionId: string;
  optionIds: string[];
  textAnswer: string | null;
  /** Explanation mode: the feedback of an already answered question (answers are final there). */
  feedback: AnswerFeedback | null;
}

/** The test an attempt belongs to, with the subtopic to go back to. */
export interface AttemptTestInfo {
  id: string;
  title: string;
  kind: TestKind;
  collection: TestCollection;
  subtopicId: string | null;
  subtopicTitle: string | null;
}

export interface AttemptSession {
  attempt: AttemptSummary;
  test: AttemptTestInfo;
  /** When a timed attempt ends (ISO). `null` when the student chose no limit. */
  deadlineAt: string | null;
  /** The server clock (ISO) when this was sent: the countdown uses it to ignore a wrong clock on the device. */
  serverNow: string;
  questions: StudentQuestion[];
  answers: SavedAnswer[];
}

/** Returned right after an answer when the student turned explanations on. */
export interface AnswerFeedback {
  isCorrect: boolean;
  correctOptionIds: string[];
  explanation: string | null;
  optionExplanations: Record<string, string>;
}

export interface SaveAnswerResult {
  saved: true;
  feedback: AnswerFeedback | null;
}

export interface ResultOption extends StudentOption {
  isCorrect: boolean;
  explanation: string | null;
  selected: boolean;
}

export interface ResultQuestion {
  id: string;
  position: number;
  body: string;
  imageFileId: string | null;
  explanation: string | null;
  answered: boolean;
  /** Choice questions. `null` for situational ones. */
  isCorrect: boolean | null;
  options: ResultOption[];
  /** Situational questions. */
  textAnswer: string | null;
  score: number | null;
  maxScore: number;
  reviewerComment: string | null;
}

export interface AttemptResult {
  attempt: AttemptSummary;
  test: AttemptTestInfo;
  questions: ResultQuestion[];
}

// ---- Reviews (situational tests) ----

export interface ReviewListItem {
  attemptId: string;
  studentName: string;
  studentEmail: string;
  testTitle: string;
  /** Where the test lives, so the situational tests of different subtopics can be told apart. `null` for AMPS etc. */
  subtopicTitle: string | null;
  topicTitle: string | null;
  subjectTitle: string | null;
  finishedAt: string;
  status: AttemptStatus;
}

export interface ReviewGradeInput {
  questionId: string;
  score: number;
  comment?: string | null;
}

export interface ReviewDetail extends AttemptResult {
  studentName: string;
  studentEmail: string;
  subtopicTitle: string | null;
  topicTitle: string | null;
  subjectTitle: string | null;
}
