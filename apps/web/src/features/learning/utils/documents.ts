export type DocumentKind = 'pdf' | 'word' | 'excel' | 'other';

const WORD_TYPES = [
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
];
const EXCEL_TYPES = [
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
];

/** What kind of office document a stored file is, judged by its mime type. */
export function getDocumentKind(mimeType: string): DocumentKind {
  if (mimeType === 'application/pdf') return 'pdf';
  if (WORD_TYPES.includes(mimeType)) return 'word';
  if (EXCEL_TYPES.includes(mimeType)) return 'excel';
  return 'other';
}
