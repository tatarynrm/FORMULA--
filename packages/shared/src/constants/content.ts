export const CONTENT_STATUSES = ['draft', 'published'] as const;
export type ContentStatus = (typeof CONTENT_STATUSES)[number];

/** `choice`: pick answer options, graded at once. `situational`: write an answer, graded by an admin. */
export const TEST_KINDS = ['choice', 'situational'] as const;
export type TestKind = (typeof TEST_KINDS)[number];

/** `subtopic` tests live inside a subtopic; the others are the "bases", "booklets" and "AMPS" lists. */
export const TEST_COLLECTIONS = ['subtopic', 'base', 'booklet', 'amps'] as const;
export type TestCollection = (typeof TEST_COLLECTIONS)[number];

/** Admin section (menu key) that manages each collection of tests. */
export const COLLECTION_SECTIONS: Record<TestCollection, string> = {
  subtopic: 'subjects',
  base: 'bases',
  booklet: 'booklets',
  amps: 'amps',
};

export const MATERIAL_KINDS = ['video', 'document'] as const;
export type MaterialKind = (typeof MATERIAL_KINDS)[number];

/** `chat`: a picture sent in the support chat (any signed-in user may upload one). */
export const FILE_PURPOSES = ['avatar', 'image', 'video', 'document', 'chat'] as const;
export type FilePurpose = (typeof FILE_PURPOSES)[number];

const MB = 1024 * 1024;

/** Upload rules per purpose. Both api and web read them, so the form can warn before the upload. */
export const UPLOADS = {
  avatar: { maxBytes: 5 * MB, mimeTypes: ['image/png', 'image/jpeg', 'image/webp', 'image/gif'] },
  image: { maxBytes: 10 * MB, mimeTypes: ['image/png', 'image/jpeg', 'image/webp', 'image/gif'] },
  chat: { maxBytes: 10 * MB, mimeTypes: ['image/png', 'image/jpeg', 'image/webp', 'image/gif'] },
  video: { maxBytes: 1024 * MB, mimeTypes: ['video/mp4', 'video/webm', 'video/quicktime'] },
  document: {
    maxBytes: 50 * MB,
    mimeTypes: [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    ],
  },
} as const satisfies Record<FilePurpose, { maxBytes: number; mimeTypes: readonly string[] }>;

export const ATTEMPT_STATUSES = ['in_progress', 'completed', 'pending_review', 'reviewed'] as const;
export type AttemptStatus = (typeof ATTEMPT_STATUSES)[number];

export const TESTS = {
  MIN_OPTIONS: 2,
  MAX_OPTIONS: 10,
  /** Option letters: the first option is A, the second B... */
  LETTERS: 'ABCDEFGHIJ',
  TITLE_MAX_LENGTH: 200,
  BODY_MAX_LENGTH: 5000,
  ANSWER_MAX_LENGTH: 10000,
} as const;
