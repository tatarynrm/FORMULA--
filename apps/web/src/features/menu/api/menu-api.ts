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
  mine: () => apiFetch<MenuItem[]>('/v1/menu'),

  /** A page-kind item (text written by the superadmin). 404 when the person may not open it. */
  page: (itemId: string) => apiFetch<MenuPage>(`/v1/menu/pages/${itemId}`),

  // Superadmin only.
  pageBody: (itemId: string) => apiFetch<{ bodyHtml: string }>(`/v1/admin/menu/${itemId}/page`),
  savePageBody: (itemId: string, bodyHtml: string) =>
    apiFetch<{ bodyHtml: string }>(`/v1/admin/menu/${itemId}/page`, {
      method: 'PUT',
      body: { bodyHtml },
    }),
  list: (audience: MenuAudience) =>
    apiFetch<MenuItemAdmin[]>(`/v1/admin/menu?audience=${audience}`),
  create: (input: CreateMenuItemInput) =>
    apiFetch<MenuItemAdmin>('/v1/admin/menu', { method: 'POST', body: input }),
  update: (id: string, input: UpdateMenuItemInput) =>
    apiFetch<MenuItemAdmin>(`/v1/admin/menu/${id}`, { method: 'PATCH', body: input }),
  remove: (id: string) => apiFetch<{ deleted: true }>(`/v1/admin/menu/${id}`, { method: 'DELETE' }),
  reorder: (audience: MenuAudience, ids: string[]) =>
    apiFetch<MenuItemAdmin[]>('/v1/admin/menu/order', { method: 'PUT', body: { audience, ids } }),
};
