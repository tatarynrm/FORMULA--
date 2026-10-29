'use client';

import { usePathname, useRouter } from 'next/navigation';
import { type ReactNode, useEffect } from 'react';

import { EmptyState } from '@/components/common/empty-state';
import { LogoLoader } from '@/components/common/logo-loader';
import { getAdminSections } from '@/features/admin/constants';
import { useMenu } from '@/features/menu/hooks/use-menu';
import { t } from '@/locales';

import { useCurrentUser } from '../hooks/use-current-user';

/**
 * UI-level check for the admin area. The real enforcement is the section guard on every api route;
 * this only avoids showing pages a person has no rights to. A subadmin who opens `/admin` without
 * the first section is sent to the first section they do have (or to their profile).
 */
export function AdminGuard({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { data: user, isPending: userPending } = useCurrentUser();
  const { data: menu, isPending: menuPending } = useMenu();

  const isAdmin = user?.role === 'admin';
  const sections = getAdminSections(pathname);
  // `null`: not an admin route we know (Next shows its 404). `[]`: any admin may open it.
  const allowed =
    sections === null ||
    sections.length === 0 ||
    (menu?.some((item) => sections.includes(item.key)) ?? false);
  const fallback = menu?.[0]?.href ?? '/admin/profile';

  useEffect(() => {
    if (isAdmin && menu && !allowed && pathname === '/admin') {
      router.replace(fallback);
    }
  }, [isAdmin, menu, allowed, pathname, fallback, router]);

  if (userPending || menuPending) return <LogoLoader size="lg" fill />;
  if (!isAdmin) return <EmptyState title={t.admin.forbidden} />;
  if (!allowed) {
    // On the root the effect above is already redirecting.
    return pathname === '/admin' ? (
      <LogoLoader size="lg" fill />
    ) : (
      <EmptyState title={t.admin.forbidden} />
    );
  }
  return children;
}
