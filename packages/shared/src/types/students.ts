import type { AttemptStatus, TestCollection, TestKind } from '../constants/content.js';
import type { MessengerBot } from '../constants/index.js';
import type { AuthUser } from '../schemas/auth.js';
import type { ProfileMessenger } from '../schemas/profile.js';
import type { SubjectGrant, SubtopicGrant } from './content.js';
import type { ProgressSummary } from './progress.js';
import type { PresenceSession, UserPresence } from './presence.js';

/** A messenger bot connected by the student (the admin sees whether it works and who it is). */
export interface StudentBotInfo {
  provider: MessengerBot;
  /** The phone number was not shared in the bot yet, so nothing is sent. */
  awaitingPhone: boolean;
  username: string | null;
  /** The number shared in the bot, `null` until then. */
  phone: string | null;
  notificationsEnabled: boolean;
}

/** What the student told us about themselves (labels, ready to show). */
export interface StudentProfileInfo {
  /** `+380 98 938 55 85`, or `null`. */
  phone: string | null;
  messengers: ProfileMessenger[];
  bots: StudentBotInfo[];
  statusCode: string | null;
  statusLabel: string | null;
  goalCode: string | null;
  goalLabel: string | null;
  institutionKind: 'university' | 'other' | null;
  institutionName: string | null;
  onboardingCompleted: boolean;
}

/** Numbers shown next to a student in the admin list. */
export interface StudentListStats {
  /** Tests finished at least once. */
  testsPassed: number;
  /** Average of the best result of every graded test, 0-100. */
  averagePercent: number | null;
  subjectGrants: number;
  subtopicGrants: number;
}

/** A row of the admin "Students" list. */
export interface StudentListItem extends AuthUser {
  presence: UserPresence;
  profile: StudentProfileInfo;
  stats: StudentListStats;
  lastLoginAt: string | null;
  /** Signed up or linked through Google. */
  googleLinked: boolean;
}

/** The student page in the admin panel. */
export interface StudentDetail extends StudentListItem {
  progress: ProgressSummary;
  subjectGrants: SubjectGrant[];
  subtopicGrants: SubtopicGrant[];
  /** Newest sessions first (see `StudentPresenceHistory`). */
  sessions: PresenceSession[];
  activeDaysLast30: number;
}

/** One attempt of a student, as the admin sees it. */
export interface StudentAttemptItem {
  id: string;
  status: AttemptStatus;
  startedAt: string;
  finishedAt: string | null;
  score: number | null;
  maxScore: number | null;
  percent: number | null;
  test: {
    id: string;
    title: string;
    kind: TestKind;
    collection: TestCollection;
    subtopicId: string | null;
    subtopicTitle: string | null;
    subjectTitle: string | null;
  };
}

/** Query of the admin "Students" list. */
export interface StudentListQuery {
  page?: number;
  limit?: number;
  /** Matches name, surname or email. */
  q?: string;
  /** Only students online right now. */
  online?: boolean;
  sort?: 'newest' | 'name' | 'lastSeen';
}
