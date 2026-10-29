import type { MenuAudience, MenuIcon, MenuItemKind } from '@formula/shared';

export interface MenuItemRow {
  id: string;
  audience: MenuAudience;
  key: string;
  label: string;
  href: string;
  icon: MenuIcon;
  kind: MenuItemKind;
  exact_match: boolean;
  sort_order: number;
  is_active: boolean;
  is_system: boolean;
  superadmin_only: boolean;
}

export interface MenuItemRecord {
  id: string;
  audience: MenuAudience;
  key: string;
  label: string;
  href: string;
  icon: MenuIcon;
  kind: MenuItemKind;
  exact: boolean;
  sortOrder: number;
  isActive: boolean;
  isSystem: boolean;
  superadminOnly: boolean;
}
