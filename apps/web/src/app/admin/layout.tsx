import type { Metadata } from 'next';
import type { ReactNode } from 'react';

import { AdminGuard } from '@/features/auth/components/admin-guard';
import { DashboardShell } from '@/features/dashboard/components/dashboard-shell';
import { RealtimeProvider } from '@/features/realtime/realtime-provider';
import { t } from '@/locales';

export const metadata: Metadata = {
  title: { default: t.admin.title, template: `%s | ${t.admin.title}` },
  robots: { index: false, follow: false },
};

// Layers of protection: `proxy.ts` (no session or a student token -> redirect), `AdminGuard`
// (role check once the user is loaded) and `@Roles('admin')` on every admin api route.
export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <RealtimeProvider>
      <DashboardShell homeHref="/admin">
        <AdminGuard>{children}</AdminGuard>
      </DashboardShell>
    </RealtimeProvider>
  );
}
