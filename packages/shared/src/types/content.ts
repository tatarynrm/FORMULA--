import type { ContentStatus, MaterialKind } from '../constants/content.js';

/** A video or document attached to a subtopic. `fileId` is opened at `/api/files/:id`. */
export interface Material {
  id: string;
  kind: MaterialKind;
  title: string;
  fileId: string;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  sortOrder: number;
}

// ---- Admin side ----

export interface AdminSubject {
  id: string;
  title: string;
  description: string | null;
  status: ContentStatus;
  sortOrder: number;
  topicCount: number;
}

export interface AdminSubtopicSummary {
  id: string;
  topicId: string;
  title: string;
  status: ContentStatus;
  isFree: boolean;
  sortOrder: number;
  materialCount: number;
  testCount: number;
}

export interface AdminTopic {
  id: string;
  subjectId: string;
  title: string;
  status: ContentStatus;
  sortOrder: number;
  subtopics: AdminSubtopicSummary[];
}

/** Subject with its whole tree, for the topics screen. */
export interface AdminSubjectTree extends AdminSubject {
  topics: AdminTopic[];
}

export interface AdminSubtopic extends AdminSubtopicSummary {
  descriptionHtml: string;
  subjectId: string;
  subjectTitle: string;
  topicTitle: string;
  materials: Material[];
}

// ---- Student side ----

export interface StudentSubtopicSummary {
  id: string;
  title: string;
  isFree: boolean;
  /** Free, or the student has been granted access. Locked subtopics show a lock instead of content. */
  hasAccess: boolean;
  testCount: number;
}

export interface StudentTopic {
  id: string;
  title: string;
  subtopics: StudentSubtopicSummary[];
}

export interface StudentSubject {
  id: string;
  title: string;
  description: string | null;
  /** The whole subject was opened for the student, so every subtopic (also future ones) is open. */
  hasFullAccess: boolean;
  topics: StudentTopic[];
}

/** `descriptionHtml` and `materials` are empty while the student has no access. */
export interface StudentSubtopic {
  id: string;
  title: string;
  isFree: boolean;
  hasAccess: boolean;
  subjectId: string;
  subjectTitle: string;
  topicTitle: string;
  descriptionHtml: string;
  materials: Material[];
}

/** Access of one student to a whole subject (admin view): every subtopic of it, now and later. */
export interface SubjectGrant {
  subjectId: string;
  subjectTitle: string;
  source: 'manual' | 'payment';
  createdAt: string;
}

/** Access of one student to one subtopic (admin view). */
export interface SubtopicGrant {
  subtopicId: string;
  subtopicTitle: string;
  topicTitle: string;
  subjectTitle: string;
  source: 'manual' | 'payment';
  createdAt: string;
}

/** A subtopic with its place in the tree: the "give access" picker lists these. */
export interface CatalogSubtopic {
  id: string;
  title: string;
  isFree: boolean;
  topicId: string;
  topicTitle: string;
  subjectId: string;
  subjectTitle: string;
}

export interface UploadedFile {
  id: string;
  name: string;
  mimeType: string;
  sizeBytes: number;
}
