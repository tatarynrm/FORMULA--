import type {
  AdminTestimonial,
  MyTestimonial,
  PublicTestimonial,
  SubmitTestimonialInput,
  SubmitTestimonialResult,
  TestimonialCounts,
  TestimonialStatus,
  UpdateTestimonialInput,
} from '@formula/shared';

import { apiFetch, apiFetchPage } from '@/lib/api-client';

/** Public side: the published testimonials and leaving one. */
export const testimonialsApi = {
  listPublic: () => apiFetch<PublicTestimonial[]>('/testimonials'),

  submit: (input: SubmitTestimonialInput) =>
    apiFetch<SubmitTestimonialResult>('/testimonials', { method: 'POST', body: input }),

  mine: () => apiFetch<MyTestimonial[]>('/testimonials/mine'),
};

/** Moderation (the `testimonials` section). */
export const adminTestimonialsApi = {
  list: (status: TestimonialStatus, page: number, limit: number) =>
    apiFetchPage<AdminTestimonial>(
      `/admin/testimonials?status=${status}&page=${page}&limit=${limit}`,
    ),

  counts: () => apiFetch<TestimonialCounts>('/admin/testimonials/counts'),

  update: (id: string, input: UpdateTestimonialInput) =>
    apiFetch<AdminTestimonial>(`/admin/testimonials/${encodeURIComponent(id)}`, {
      method: 'PATCH',
      body: input,
    }),

  remove: (id: string) =>
    apiFetch<null>(`/admin/testimonials/${encodeURIComponent(id)}`, { method: 'DELETE' }),
};
