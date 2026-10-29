import type { Profile, ProfileOptions, UpdateProfileInput } from '@formula/shared';

import { apiFetch } from '@/lib/api-client';

export const profileApi = {
  options: () => apiFetch<ProfileOptions>('/v1/profile/options'),
  get: () => apiFetch<Profile>('/v1/profile'),
  update: (input: UpdateProfileInput) =>
    apiFetch<Profile>('/v1/profile', { method: 'PUT', body: input }),
};
