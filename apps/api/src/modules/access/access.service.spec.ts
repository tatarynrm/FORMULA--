import type { AdminContext } from './access.repository.js';
import type { AccessRepository } from './access.repository.js';
import { AccessService } from './access.service.js';

const service = new AccessService({} as AccessRepository);

const student: AdminContext = { role: 'student', adminLevel: null, permissions: [] };
const superadmin: AdminContext = { role: 'admin', adminLevel: 'superadmin', permissions: [] };
const subadmin: AdminContext = { role: 'admin', adminLevel: 'subadmin', permissions: ['bases'] };

describe('AccessService', () => {
  it('lets a superadmin use every section', () => {
    expect(service.isSuperadmin(superadmin)).toBe(true);
    expect(service.canUseSection(superadmin, 'bases')).toBe(true);
    expect(service.canUseSection(superadmin, 'anything')).toBe(true);
  });

  it('limits a subadmin to the sections that were granted', () => {
    expect(service.isSuperadmin(subadmin)).toBe(false);
    expect(service.canUseSection(subadmin, 'bases')).toBe(true);
    expect(service.canUseSection(subadmin, 'students')).toBe(false);
    expect(service.canUseSection(subadmin, 'staff')).toBe(false);
  });

  it('gives students and unknown users nothing', () => {
    expect(service.isSuperadmin(student)).toBe(false);
    expect(service.canUseSection(student, 'bases')).toBe(false);
    expect(service.canUseSection(null, 'bases')).toBe(false);
    expect(service.isSuperadmin(null)).toBe(false);
  });

  it('does not trust stale permission rows of a student', () => {
    // A leftover row must not matter: only an admin level opens sections.
    expect(
      service.canUseSection({ role: 'student', adminLevel: null, permissions: ['bases'] }, 'bases'),
    ).toBe(false);
  });
});
