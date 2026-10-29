import type {
  CreateMenuItemInput,
  MenuAudience,
  MenuItem,
  MenuItemAdmin,
  MenuPage,
  UpdateMenuItemInput,
} from '@formula/shared';

import { apiFetch } from '@/lib/api-client';

export const menuApi = {
  /** Navigation of the signed-in user. The api decides what each person may see. */
  mine: () => apiFetch<MenuItem[]>('/menu'),

  /** A page-kind item (text written by the superadmin). 404 when the person may not open it. */
  page: (itemId: string) => apiFetch<MenuPage>(`/menu/pages/${itemId}`),

  // Superadmin only.
  pageBody: (itemId: string) => apiFetch<{ bodyHtml: string }>(`/admin/menu/${itemId}/page`),
  savePageBody: (itemId: string, bodyHtml: string) =>
    apiFetch<{ bodyHtml: string }>(`/admin/menu/${itemId}/page`, {
      method: 'PUT',
      body: { bodyHtml },
    }),
  list: (audience: MenuAudience) => apiFetch<MenuItemAdmin[]>(`/admin/menu?audience=${audience}`),
  create: (input: CreateMenuItemInput) =>
    apiFetch<MenuItemAdmin>('/admin/menu', { method: 'POST', body: input }),
  update: (id: string, input: UpdateMenuItemInput) =>
    apiFetch<MenuItemAdmin>(`/admin/menu/${id}`, { method: 'PATCH', body: input }),
  remove: (id: string) => apiFetch<{ deleted: true }>(`/admin/menu/${id}`, { method: 'DELETE' }),
  reorder: (audience: MenuAudience, ids: string[]) =>
    apiFetch<MenuItemAdmin[]>('/admin/menu/order', { method: 'PUT', body: { audience, ids } }),
};
