import type { AdminLevel, StaffMember } from '@formula/shared';
import { Injectable } from '@nestjs/common';

import { DatabaseService, type Queryable } from '../database/database.service.js';

interface StaffRow {
  id: string;
  email: string;
  name: string;
  surname: string;
  admin_level: AdminLevel;
  created_at: Date;
  permissions: string[];
}

/** One row per admin. Everything comes from `admins` and `admin_permissions`, joined to the user for the name. */
const SELECT_STAFF = `
  SELECT u.id, u.email, u.name, u.surname, a.level AS admin_level, a.created_at,
         COALESCE(
           array_agg(p.section_key ORDER BY p.section_key) FILTER (WHERE p.section_key IS NOT NULL),
           '{}'
         ) AS permissions
  FROM admins a
  JOIN users u ON u.id = a.user_id
  LEFT JOIN admin_permissions p ON p.admin_id = a.user_id`;

function toMember(row: StaffRow): StaffMember {
  return {
    id: row.id,
    email: row.email,
    name: row.name,
    surname: row.surname,
    adminLevel: row.admin_level,
    // Superadmins use everything, so stored rows (if any) are not meaningful for them.
    permissions: row.admin_level === 'superadmin' ? [] : row.permissions,
    createdAt: row.created_at.toISOString(),
  };
}

@Injectable()
export class StaffRepository {
  constructor(private readonly database: DatabaseService) {}

  async findAll(): Promise<StaffMember[]> {
    const rows = await this.database.query<StaffRow>(
      `${SELECT_STAFF} GROUP BY u.id, a.user_id ORDER BY a.level DESC, a.created_at`,
    );
    return rows.map(toMember);
  }

  async findById(id: string, db: Queryable = this.database): Promise<StaffMember | null> {
    const row = await db.queryOne<StaffRow>(
      `${SELECT_STAFF} WHERE a.user_id = $1 GROUP BY u.id, a.user_id`,
      [id],
    );
    return row ? toMember(row) : null;
  }

  /** Replaces the sections of an admin. Runs in the caller's transaction when one is given. */
  private async writePermissions(
    tx: Queryable,
    adminId: string,
    sectionKeys: string[],
    grantedBy: string,
  ): Promise<void> {
    await tx.query('DELETE FROM admin_permissions WHERE admin_id = $1', [adminId]);
    if (sectionKeys.length > 0) {
      await tx.query(
        `INSERT INTO admin_permissions (admin_id, section_key, granted_by)
         SELECT $1, key, $3 FROM unnest($2::text[]) AS key`,
        [adminId, sectionKeys, grantedBy],
      );
    }
  }

  /** Replaces the granted sections of an admin in one transaction. */
  async setPermissions(
    adminId: string,
    sectionKeys: string[],
    grantedBy: string,
  ): Promise<StaffMember | null> {
    return this.database.transaction(async (tx) => {
      await this.writePermissions(tx, adminId, sectionKeys, grantedBy);
      return this.findById(adminId, tx);
    });
  }

  /** Makes an existing account a subadmin with the given sections. */
  async promote(
    userId: string,
    sectionKeys: string[],
    grantedBy: string,
  ): Promise<StaffMember | null> {
    return this.database.transaction(async (tx) => {
      await tx.query(
        `INSERT INTO admins (user_id, level, created_by) VALUES ($1, 'subadmin', $2)
         ON CONFLICT (user_id) DO NOTHING`,
        [userId, grantedBy],
      );
      await this.writePermissions(tx, userId, sectionKeys, grantedBy);
      return this.findById(userId, tx);
    });
  }

  /**
   * Creates a brand-new account that is a subadmin from the start. The user and the admin row are
   * written together, so a failure cannot leave a half-made admin. Throws a pg unique violation
   * (23505) when the email is already registered.
   */
  async createSubadminAccount(input: {
    email: string;
    name: string;
    surname: string;
    passwordHash: string;
    sectionKeys: string[];
    createdBy: string;
  }): Promise<StaffMember | null> {
    return this.database.transaction(async (tx) => {
      const user = await tx.queryOne<{ id: string }>(
        `INSERT INTO users (email, name, surname, password_hash) VALUES ($1, $2, $3, $4) RETURNING id`,
        [input.email, input.name, input.surname, input.passwordHash],
      );
      if (!user) throw new Error('INSERT INTO users returned no row');

      await tx.query(
        `INSERT INTO admins (user_id, level, created_by) VALUES ($1, 'subadmin', $2)`,
        [user.id, input.createdBy],
      );
      await this.writePermissions(tx, user.id, input.sectionKeys, input.createdBy);
      return this.findById(user.id, tx);
    });
  }

  /**
   * Takes the admin rights away: the `admins` row goes, and its permissions with it (cascade).
   * Only subadmins can be removed here. Returns false if nothing was removed.
   */
  async demote(userId: string): Promise<boolean> {
    const rows = await this.database.query(
      `DELETE FROM admins WHERE user_id = $1 AND level = 'subadmin' RETURNING user_id`,
      [userId],
    );
    return rows.length > 0;
  }
}
