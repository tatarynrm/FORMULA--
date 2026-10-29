import type { ProgressSummary, SubjectProgress } from '@formula/shared';

import { apiFetch } from '@/lib/api-client';

export const progressApi = {
  summary: () => apiFetch<ProgressSummary>('/progress/summary'),
  subjects: () => apiFetch<SubjectProgress[]>('/progress/subjects'),
};
