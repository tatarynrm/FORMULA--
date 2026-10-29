import { z } from 'zod';

import { MENU, MENU_AUDIENCES, MENU_ICONS, MENU_ITEM_KINDS } from '../constants/index.js';

/** One entry of the navigation, as the web app renders it. */
export const menuItemSchema = z.object({
  id: z.uuid(),
  key: z.string(),
  label: z.string(),
  href: z.string(),
  icon: z.enum(MENU_ICONS),
  exact: z.boolean(),
  kind: z.enum(MENU_ITEM_KINDS),
});

/** Full row for the superadmin menu editor. */
export const menuItemAdminSchema = menuItemSchema.extend({
  audience: z.enum(MENU_AUDIENCES),
  sortOrder: z.number().int(),
  isActive: z.boolean(),
  isSystem: z.boolean(),
  superadminOnly: z.boolean(),
});

const labelSchema = z.string().trim().min(1).max(MENU.LABEL_MAX_LENGTH);
/** Only paths inside the site, so a menu item can never send users to another domain. */
const hrefSchema = z
  .string()
  .trim()
  .max(MENU.HREF_MAX_LENGTH)
  .regex(/^\/(?!\/)[\w\-./]*$/, 'Must be a path inside the site');

/** A link needs a path; a page gets its own address from the api. */
export const createMenuItemSchema = z.discriminatedUnion('kind', [
  z.object({
    kind: z.literal('link'),
    audience: z.enum(MENU_AUDIENCES),
    label: labelSchema,
    href: hrefSchema,
    icon: z.enum(MENU_ICONS),
  }),
  z.object({
    kind: z.literal('page'),
    audience: z.enum(MENU_AUDIENCES),
    label: labelSchema,
    icon: z.enum(MENU_ICONS),
  }),
]);

export const updateMenuItemSchema = z.object({
  label: labelSchema.optional(),
  href: hrefSchema.optional(),
  icon: z.enum(MENU_ICONS).optional(),
  isActive: z.boolean().optional(),
});

/** Content of a page-kind menu item, as shown to the people who may open it. */
export const menuPageSchema = z.object({
  id: z.uuid(),
  title: z.string(),
  bodyHtml: z.string(),
});

export const updateMenuPageSchema = z.object({ bodyHtml: z.string().max(MENU.PAGE_MAX_LENGTH) });

export type MenuPage = z.infer<typeof menuPageSchema>;
export type UpdateMenuPageInput = z.infer<typeof updateMenuPageSchema>;
export type MenuItem = z.infer<typeof menuItemSchema>;
export type MenuItemAdmin = z.infer<typeof menuItemAdminSchema>;
export type CreateMenuItemInput = z.infer<typeof createMenuItemSchema>;
export type UpdateMenuItemInput = z.infer<typeof updateMenuItemSchema>;
