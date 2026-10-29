'use client';

import type { StudentListQuery } from '@formula/shared';
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { type StudentNamePatch, studentsApi } from '../api/students-api';
import { adminKeys, adminQueryOptions } from './query-keys';

export const STUDENTS_PAGE_SIZE = 20;

/** Who is online changes by the minute, so the open list asks again this often. */
const PRESENCE_REFRESH_MS = 30_000;

export function useStudents(query: Omit<StudentListQuery, 'limit'>) {
  return useQuery({
    queryKey: adminKeys.students(query),
    queryFn: () => studentsApi.list({ ...query, limit: STUDENTS_PAGE_SIZE }),
    // Keep the previous page on screen while the next one loads, so the list does not flicker.
    placeholderData: keepPreviousData,
    refetchInterval: PRESENCE_REFRESH_MS,
    ...adminQueryOptions,
  });
}

/** One student with profile, progress, grants and sessions. */
export function useStudent(id: string) {
  return useQuery({
    queryKey: adminKeys.student(id),
    queryFn: () => studentsApi.get(id),
    ...adminQueryOptions,
  });
}

export function useStudentAttempts(id: string) {
  return useQuery({
    queryKey: adminKeys.studentAttempts(id),
    queryFn: () => studentsApi.attempts(id),
    ...adminQueryOptions,
  });
}

export function useStudentMutations(id: string) {
  const queryClient = useQueryClient();

  return {
    rename: useMutation({
      mutationFn: (patch: StudentNamePatch) => studentsApi.rename(id, patch),
      onSuccess: (student) => {
        queryClient.setQueryData(adminKeys.student(id), student);
        return queryClient.invalidateQueries({ queryKey: adminKeys.studentsAll });
      },
    }),
    // The page of the removed student navigates away; its queries are dropped so nothing refetches a 404.
    remove: useMutation({
      mutationFn: () => studentsApi.remove(id),
      onSuccess: () => {
        queryClient.removeQueries({ queryKey: adminKeys.student(id) });
        return queryClient.invalidateQueries({ queryKey: adminKeys.studentsAll });
      },
    }),
  };
}
