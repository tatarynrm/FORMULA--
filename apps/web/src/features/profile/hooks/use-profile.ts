'use client';

import type { AuthUser } from '@formula/shared';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { CURRENT_USER_KEY } from '@/features/auth/hooks/use-current-user';

import { profileApi } from '../api/profile-api';

const PROFILE_KEY = ['profile'] as const;

export function useProfileOptions() {
  return useQuery({
    queryKey: ['profile', 'options'],
    queryFn: profileApi.options,
    staleTime: Infinity,
  });
}

export function useProfile() {
  return useQuery({ queryKey: PROFILE_KEY, queryFn: profileApi.get });
}

export function useUpdateProfile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: profileApi.update,
    onSuccess: (profile) => {
      queryClient.setQueryData(PROFILE_KEY, profile);
      // The current user carries the name, avatar and onboarding flag, keep them in sync.
      queryClient.setQueryData<AuthUser>(CURRENT_USER_KEY, (user) =>
        user
          ? {
              ...user,
              name: profile.name,
              surname: profile.surname,
              avatarFileId: profile.avatarFileId,
              onboardingCompleted: profile.onboardingCompleted,
            }
          : user,
      );
    },
  });
}
