import type { CreateStaffInput, StaffMember } from '@formula/shared';

import { apiFetch } from '@/lib/api-client';

// Superadmin only: the api answers 403 for everyone else.
export const staffApi = {
  list: () => apiFetch<StaffMember[]>('/v1/admin/staff'),
  create: (input: CreateStaffInput) =>
    apiFetch<StaffMember>('/v1/admin/staff', { method: 'POST', body: input }),
  updatePermissions: (id: string, permissions: string[]) =>
    apiFetch<StaffMember>(`/v1/admin/staff/${id}/permissions`, {
      method: 'PUT',
      body: { permissions },
    }),
  remove: (id: string) =>
    apiFetch<{ removed: true }>(`/v1/admin/staff/${id}`, { method: 'DELETE' }),
};
