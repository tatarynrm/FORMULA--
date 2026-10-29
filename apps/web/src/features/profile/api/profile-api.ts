import type { Profile, ProfileOptions, UpdateProfileInput } from '@formula/shared';

import { apiFetch } from '@/lib/api-client';

export const profileApi = {
  options: () => apiFetch<ProfileOptions>('/profile/options'),
  get: () => apiFetch<Profile>('/profile'),
  update: (input: UpdateProfileInput) =>
    apiFetch<Profile>('/profile', { method: 'PUT', body: input }),
};
