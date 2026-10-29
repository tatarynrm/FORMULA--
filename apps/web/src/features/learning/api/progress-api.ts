import type { ProgressSummary, SubjectProgress } from '@formula/shared';

import { apiFetch } from '@/lib/api-client';

export const progressApi = {
  summary: () => apiFetch<ProgressSummary>('/v1/progress/summary'),
  subjects: () => apiFetch<SubjectProgress[]>('/v1/progress/subjects'),
};
