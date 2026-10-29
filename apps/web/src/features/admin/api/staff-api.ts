import type { CreateStaffInput, StaffMember } from '@formula/shared';

import { apiFetch } from '@/lib/api-client';

// Superadmin only: the api answers 403 for everyone else.
export const staffApi = {
  list: () => apiFetch<StaffMember[]>('/admin/staff'),
  create: (input: CreateStaffInput) =>
    apiFetch<StaffMember>('/admin/staff', { method: 'POST', body: input }),
  updatePermissions: (id: string, permissions: string[]) =>
    apiFetch<StaffMember>(`/admin/staff/${id}/permissions`, {
      method: 'PUT',
      body: { permissions },
    }),
  remove: (id: string) => apiFetch<{ removed: true }>(`/admin/staff/${id}`, { method: 'DELETE' }),
};
