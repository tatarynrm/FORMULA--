'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { accessApi } from '../api/access-api';
import { adminKeys, adminQueryOptions, invalidateStudent } from './query-keys';

/** Flat list of all subtopics for the access tree. Only loaded while the dialog is open. */
export function useCatalogSubtopics(enabled: boolean) {
  return useQuery({
    queryKey: adminKeys.catalogSubtopics,
    queryFn: accessApi.listSubtopics,
    enabled,
    ...adminQueryOptions,
  });
}

/** Single subtopics a student was given access to by an admin (or by a payment later). */
export function useStudentGrants(userId: string, enabled: boolean) {
  return useQuery({
    queryKey: adminKeys.access(userId),
    queryFn: () => accessApi.listGrants(userId),
    enabled,
    ...adminQueryOptions,
  });
}

/** Whole subjects opened for a student: every subtopic of them, also the ones added later. */
export function useSubjectGrants(userId: string, enabled: boolean) {
  return useQuery({
    queryKey: adminKeys.subjectAccess(userId),
    queryFn: () => accessApi.listSubjectGrants(userId),
    enabled,
    ...adminQueryOptions,
  });
}

/**
 * Grant and revoke calls answer with the student's updated list, which replaces the cached one;
 * the student's page and the list (access counts) are read again.
 */
export function useAccessMutations(userId: string) {
  const queryClient = useQueryClient();
  const settle = (key: readonly unknown[]) => (grants: unknown) => {
    queryClient.setQueryData(key, grants);
    return invalidateStudent(queryClient, userId);
  };

  return {
    setGrants: useMutation({
      mutationFn: (subtopicIds: string[]) => accessApi.setGrants(userId, subtopicIds),
      onSuccess: settle(adminKeys.access(userId)),
    }),
    revoke: useMutation({
      mutationFn: (subtopicId: string) => accessApi.revoke(userId, subtopicId),
      onSuccess: settle(adminKeys.access(userId)),
    }),
    grantSubject: useMutation({
      mutationFn: (subjectId: string) => accessApi.grantSubject(userId, subjectId),
      onSuccess: settle(adminKeys.subjectAccess(userId)),
    }),
    revokeSubject: useMutation({
      mutationFn: (subjectId: string) => accessApi.revokeSubject(userId, subjectId),
      onSuccess: settle(adminKeys.subjectAccess(userId)),
    }),
  };
}
