import { Injectable } from '@nestjs/common';

import { type AdminContext, AccessRepository } from './access.repository.js';

@Injectable()
export class AccessService {
  constructor(private readonly repository: AccessRepository) {}

  getContext(userId: string): Promise<AdminContext | null> {
    return this.repository.findContext(userId);
  }

  isSuperadmin(context: AdminContext | null): boolean {
    return context?.role === 'admin' && context.adminLevel === 'superadmin';
  }

  /** Superadmins can use every section, subadmins only the ones granted to them. */
  canUseSection(context: AdminContext | null, sectionKey: string): boolean {
    if (!context || context.role !== 'admin') return false;
    return context.adminLevel === 'superadmin' || context.permissions.includes(sectionKey);
  }

  /** Ids of every admin who may use the section (to notify the whole "reviews" or "support" team). */
  listUserIdsWithSection(sectionKey: string): Promise<string[]> {
    return this.repository.listUserIdsWithSection(sectionKey);
  }
}
