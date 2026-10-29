import type { MenuAudience, MenuIcon, MenuItemKind } from '@formula/shared';
import { Injectable } from '@nestjs/common';

import { DatabaseService } from '../database/database.service.js';
import type { MenuItemRecord, MenuItemRow } from './menu.types.js';

function toRecord(row: MenuItemRow): MenuItemRecord {
  return {
    id: row.id,
    audience: row.audience,
    key: row.key,
    label: row.label,
    href: row.href,
    icon: row.icon,
    kind: row.kind,
    exact: row.exact_match,
    sortOrder: row.sort_order,
    isActive: row.is_active,
    isSystem: row.is_system,
    superadminOnly: row.superadmin_only,
  };
}

export interface MenuItemPatch {
  label?: string;
  href?: string;
  icon?: MenuIcon;
  isActive?: boolean;
}

@Injectable()
export class MenuRepository {
  constructor(private readonly database: DatabaseService) {}

  async findByAudience(audience: MenuAudience, onlyActive: boolean): Promise<MenuItemRecord[]> {
    const rows = await this.database.query<MenuItemRow>(
      `SELECT * FROM menu_items
       WHERE audience = $1 AND ($2::boolean = false OR is_active)
       ORDER BY sort_order, created_at`,
      [audience, onlyActive],
    );
    return rows.map(toRecord);
  }

  async findById(id: string): Promise<MenuItemRecord | null> {
    const row = await this.database.queryOne<MenuItemRow>(
      'SELECT * FROM menu_items WHERE id = $1',
      [id],
    );
    return row ? toRecord(row) : null;
  }

  /** Keys of the admin sections that can be granted to subadmins. */
  async findGrantableAdminKeys(): Promise<string[]> {
    const rows = await this.database.query<{ key: string }>(
      "SELECT key FROM menu_items WHERE audience = 'admin' AND NOT superadmin_only",
    );
    return rows.map((row) => row.key);
  }

  /**
   * Adds an item at the end of its menu. A `page` item also gets an empty page row, in the same
   * transaction, so a page item without content storage can never exist.
   */
  async create(input: {
    id: string;
    audience: MenuAudience;
    key: string;
    label: string;
    href: string;
    icon: MenuIcon;
    kind: MenuItemKind;
  }): Promise<MenuItemRecord> {
    return this.database.transaction(async (tx) => {
      const row = await tx.queryOne<MenuItemRow>(
        `INSERT INTO menu_items (id, audience, key, label, href, icon, kind, sort_order)
         VALUES ($1, $2, $3, $4, $5, $6, $7,
           COALESCE((SELECT max(sort_order) FROM menu_items WHERE audience = $2), 0) + 10)
         RETURNING *`,
        [input.id, input.audience, input.key, input.label, input.href, input.icon, input.kind],
      );
      if (!row) throw new Error('INSERT INTO menu_items returned no row');

      if (input.kind === 'page') {
        await tx.query('INSERT INTO menu_pages (menu_item_id) VALUES ($1)', [input.id]);
      }
      return toRecord(row);
    });
  }

  async findPageBody(itemId: string): Promise<string | null> {
    const row = await this.database.queryOne<{ body_html: string }>(
      'SELECT body_html FROM menu_pages WHERE menu_item_id = $1',
      [itemId],
    );
    return row?.body_html ?? null;
  }

  async savePageBody(itemId: string, bodyHtml: string, userId: string): Promise<void> {
    await this.database.query(
      `INSERT INTO menu_pages (menu_item_id, body_html, updated_by) VALUES ($1, $2, $3)
       ON CONFLICT (menu_item_id) DO UPDATE SET
         body_html = EXCLUDED.body_html, updated_by = EXCLUDED.updated_by, updated_at = now()`,
      [itemId, bodyHtml, userId],
    );
  }

  async update(id: string, patch: MenuItemPatch): Promise<MenuItemRecord | null> {
    const row = await this.database.queryOne<MenuItemRow>(
      `UPDATE menu_items SET
         label = COALESCE($2, label),
         href = COALESCE($3, href),
         icon = COALESCE($4, icon),
         is_active = COALESCE($5, is_active)
       WHERE id = $1
       RETURNING *`,
      [id, patch.label ?? null, patch.href ?? null, patch.icon ?? null, patch.isActive ?? null],
    );
    return row ? toRecord(row) : null;
  }

  /** Returns false when the item does not exist or is built in. */
  async deleteCustom(id: string): Promise<boolean> {
    const rows = await this.database.query(
      'DELETE FROM menu_items WHERE id = $1 AND NOT is_system RETURNING id',
      [id],
    );
    return rows.length > 0;
  }

  /** Items get `sort_order` 10, 20, 30... in the given order. */
  async reorder(audience: MenuAudience, ids: string[]): Promise<void> {
    await this.database.transaction(async (client) => {
      for (const [index, id] of ids.entries()) {
        await client.query(
          'UPDATE menu_items SET sort_order = $3 WHERE id = $1 AND audience = $2',
          [id, audience, (index + 1) * 10],
        );
      }
    });
  }
}
