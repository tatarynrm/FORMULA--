'use client';

import { useQuery } from '@tanstack/react-query';

import { authApi } from '../api/auth-api';

export const CURRENT_USER_KEY = ['auth', 'me'] as const;

/** The signed-in user, or an error when there is no valid session. Shared by all components via one query. */
export function useCurrentUser() {
  return useQuery({
    queryKey: CURRENT_USER_KEY,
    queryFn: async () => (await authApi.me()).user,
    staleTime: 5 * 60_000,
    retry: false,
  });
}
