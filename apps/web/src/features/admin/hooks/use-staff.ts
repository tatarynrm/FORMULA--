'use client';

import type { CreateStaffInput } from '@formula/shared';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { staffApi } from '../api/staff-api';

const STAFF_KEY = ['admin', 'staff'] as const;

export function useStaff() {
  return useQuery({ queryKey: STAFF_KEY, queryFn: staffApi.list });
}

export function useStaffMutations() {
  const queryClient = useQueryClient();
  const onSuccess = () => queryClient.invalidateQueries({ queryKey: STAFF_KEY });

  return {
    create: useMutation({
      mutationFn: (input: CreateStaffInput) => staffApi.create(input),
      onSuccess,
    }),
    updatePermissions: useMutation({
      mutationFn: ({ id, permissions }: { id: string; permissions: string[] }) =>
        staffApi.updatePermissions(id, permissions),
      onSuccess,
    }),
    remove: useMutation({ mutationFn: (id: string) => staffApi.remove(id), onSuccess }),
  };
}
