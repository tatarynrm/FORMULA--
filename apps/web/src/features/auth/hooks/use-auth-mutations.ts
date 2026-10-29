'use client';

import type { AuthSession } from '@formula/shared';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';

import { authApi } from '../api/auth-api';
import { getHomePath } from '../utils';
import { CURRENT_USER_KEY } from './use-current-user';

/**
 * Stores the new user in the cache and moves to `redirectTo`, or to the home of the user's role.
 * `firstStep` (used after sign-up) goes first and carries `redirectTo` along as `next`.
 */
function useStartSession(redirectTo?: string, firstStep?: string) {
  const queryClient = useQueryClient();
  const router = useRouter();

  return (session: AuthSession) => {
    queryClient.setQueryData(CURRENT_USER_KEY, session.user);
    const destination = redirectTo ?? getHomePath(session.user.role);
    router.replace(
      firstStep
        ? `${firstStep}${redirectTo ? `?next=${encodeURIComponent(redirectTo)}` : ''}`
        : destination,
    );
    router.refresh();
  };
}

export function useLogin(redirectTo?: string) {
  const startSession = useStartSession(redirectTo);
  return useMutation({ mutationFn: authApi.login, onSuccess: startSession });
}

export function useRegister(redirectTo?: string) {
  const startSession = useStartSession(redirectTo, '/onboarding');
  return useMutation({ mutationFn: authApi.register, onSuccess: startSession });
}

export function useLogout() {
  const queryClient = useQueryClient();
  const router = useRouter();

  return useMutation({
    mutationFn: authApi.logout,
    onSettled: () => {
      // Drop every cached user-specific query, even if the request itself failed.
      queryClient.clear();
      router.replace('/login');
      router.refresh();
    },
  });
}

/** The session cookies are renewed by the api, so the cached user only needs the fresh data. */
export function useChangePassword() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: authApi.changePassword,
    onSuccess: (session) => queryClient.setQueryData(CURRENT_USER_KEY, session.user),
  });
}
