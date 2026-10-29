'use client';

import type { CreateMenuItemInput, MenuAudience, UpdateMenuItemInput } from '@formula/shared';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { menuApi } from '../api/menu-api';

export const MENU_KEY = ['menu'] as const;
const editorKey = (audience: MenuAudience) => ['admin', 'menu', audience] as const;

/** Navigation of the signed-in user, delivered by the api. */
export function useMenu() {
  return useQuery({
    queryKey: MENU_KEY,
    queryFn: menuApi.mine,
    staleTime: 60_000,
  });
}

/** The text of a page-kind menu item, for the people who open it. */
export function useMenuPage(itemId: string) {
  return useQuery({
    queryKey: ['menu', 'page', itemId],
    queryFn: () => menuApi.page(itemId),
    retry: false,
  });
}

/** The text of a page for the superadmin editor, and saving it. */
export function useMenuPageEditor(itemId: string) {
  const queryClient = useQueryClient();

  const body = useQuery({
    queryKey: ['admin', 'menu', 'page', itemId],
    queryFn: () => menuApi.pageBody(itemId),
    // The editor keeps its own draft, so refetching in the background would only overwrite typing.
    refetchOnWindowFocus: false,
    staleTime: Infinity,
  });
  const save = useMutation({
    mutationFn: (bodyHtml: string) => menuApi.savePageBody(itemId, bodyHtml),
    onSuccess: (saved) => {
      queryClient.setQueryData(['admin', 'menu', 'page', itemId], saved);
      void queryClient.invalidateQueries({ queryKey: ['menu', 'page', itemId] });
    },
  });
  return { body, save };
}

export function useMenuEditor(audience: MenuAudience) {
  return useQuery({ queryKey: editorKey(audience), queryFn: () => menuApi.list(audience) });
}

/** Mutations for the superadmin editor. The live sidebar menu is refreshed after every change. */
export function useMenuMutations(audience: MenuAudience) {
  const queryClient = useQueryClient();
  const onSuccess = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: editorKey(audience) }),
      queryClient.invalidateQueries({ queryKey: MENU_KEY }),
    ]);
  };

  return {
    create: useMutation({
      mutationFn: (input: CreateMenuItemInput) => menuApi.create(input),
      onSuccess,
    }),
    update: useMutation({
      mutationFn: ({ id, input }: { id: string; input: UpdateMenuItemInput }) =>
        menuApi.update(id, input),
      onSuccess,
    }),
    remove: useMutation({ mutationFn: (id: string) => menuApi.remove(id), onSuccess }),
    reorder: useMutation({
      mutationFn: (ids: string[]) => menuApi.reorder(audience, ids),
      onSuccess,
    }),
  };
}
