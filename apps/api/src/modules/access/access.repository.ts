import type { AdminLevel, UserRole } from '@formula/shared';
import { Injectable } from '@nestjs/common';

import { DatabaseService } from '../database/database.service.js';

export interface AdminContext {
  /** `admin` exactly when the user has a row in `admins`. */
  role: UserRole;
  adminLevel: AdminLevel | null;
  /** Section keys granted to a subadmin. Superadmins are not limited by it. */
  permissions: string[];
}

/**
 * The only place that answers "is this user an admin, and what may they do?". Everything comes from
 * the `admins` and `admin_permissions` tables, never from the user row or from the token.
 */
@Injectable()
export class AccessRepository {
  constructor(private readonly database: DatabaseService) {}

  /**
   * Reads the rights from the database on every call, so a demotion applies at once (a token can be
   * 15 minutes old). `null` means the user does not exist any more.
   */
  async findContext(userId: string): Promise<AdminContext | null> {
    const user = await this.database.queryOne<{ admin_level: AdminLevel | null }>(
      `SELECT a.level AS admin_level
       FROM users u
       LEFT JOIN admins a ON a.user_id = u.id
       WHERE u.id = $1`,
      [userId],
    );
    if (!user) return null;
    if (!user.admin_level) return { role: 'student', adminLevel: null, permissions: [] };

    const rows = await this.database.query<{ section_key: string }>(
      'SELECT section_key FROM admin_permissions WHERE admin_id = $1',
      [userId],
    );
    return {
      role: 'admin',
      adminLevel: user.admin_level,
      permissions: rows.map((row) => row.section_key),
    };
  }

  /** Every admin who may use a section: all superadmins plus the subadmins granted it. */
  async listUserIdsWithSection(sectionKey: string): Promise<string[]> {
    const rows = await this.database.query<{ user_id: string }>(
      `SELECT a.user_id
       FROM admins a
       WHERE a.level = 'superadmin'
          OR EXISTS (SELECT 1 FROM admin_permissions p
                     WHERE p.admin_id = a.user_id AND p.section_key = $1)`,
      [sectionKey],
    );
    return rows.map((row) => row.user_id);
  }
}
