/** Numbers on the student's home screen. */
export interface ProgressSummary {
  /** Tests the student has finished at least once. */
  testsPassed: number;
  /** Average of the best result of every graded test, 0-100. `null` until there is one. */
  averagePercent: number | null;
  /** Wrong answers in the latest finished attempt of each choice test: what is left to work through. */
  mistakes: number;
  /** Subtopics the student can open whose tests were all finished. */
  subtopicsDone: number;
  /** Subtopics the student can open (free ones and the ones with granted access). */
  subtopicsTotal: number;
}

/** One course card on the student's home screen. */
export interface SubjectProgress {
  subjectId: string;
  title: string;
  description: string | null;
  topicCount: number;
  /** The whole subject was opened for the student (also covers subtopics added later). */
  hasFullAccess: boolean;
  /** All published subtopics of the subject. */
  subtopicsTotal: number;
  /** Of those, the ones the student can open. */
  subtopicsAccessible: number;
  /** Of those, the ones with every test finished. */
  subtopicsDone: number;
  /** `subtopicsDone` of `subtopicsAccessible`, 0-100. */
  percent: number;
}
