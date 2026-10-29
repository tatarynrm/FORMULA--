import type { ReactNode } from 'react';

import { SessionGuard } from '@/features/auth/components/session-guard';

import { DashboardMobileBar } from './dashboard-mobile-bar';
import { DashboardSidebar } from './dashboard-sidebar';

interface DashboardShellProps {
  homeHref: string;
  children: ReactNode;
}

/** Page frame shared by the student cabinet and the admin panel: sidebar on `bg/page`, content on a raised surface. */
export function DashboardShell({ homeHref, children }: DashboardShellProps) {
  return (
    <div className="min-h-dvh lg:flex lg:py-6 lg:pr-6">
      <SessionGuard />
      <aside className="hidden w-79 shrink-0 px-6 pt-6 lg:block">
        <div className="sticky top-12 h-[calc(100dvh-6rem)]">
          <DashboardSidebar homeHref={homeHref} />
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <DashboardMobileBar homeHref={homeHref} />
        <main className="bg-card min-h-225 flex-1 rounded-t-3xl px-4 py-6 md:px-6 md:py-9 lg:rounded-3xl">
          {children}
        </main>
      </div>
    </div>
  );
}
