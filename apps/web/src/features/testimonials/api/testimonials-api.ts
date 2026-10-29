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
  listPublic: () => apiFetch<PublicTestimonial[]>('/v1/testimonials'),

  submit: (input: SubmitTestimonialInput) =>
    apiFetch<SubmitTestimonialResult>('/v1/testimonials', { method: 'POST', body: input }),

  mine: () => apiFetch<MyTestimonial[]>('/v1/testimonials/mine'),
};

/** Moderation (the `testimonials` section). */
export const adminTestimonialsApi = {
  list: (status: TestimonialStatus, page: number, limit: number) =>
    apiFetchPage<AdminTestimonial>(
      `/v1/admin/testimonials?status=${status}&page=${page}&limit=${limit}`,
    ),

  counts: () => apiFetch<TestimonialCounts>('/v1/admin/testimonials/counts'),

  update: (id: string, input: UpdateTestimonialInput) =>
    apiFetch<AdminTestimonial>(`/v1/admin/testimonials/${encodeURIComponent(id)}`, {
      method: 'PATCH',
      body: input,
    }),

  remove: (id: string) =>
    apiFetch<null>(`/v1/admin/testimonials/${encodeURIComponent(id)}`, { method: 'DELETE' }),
};
